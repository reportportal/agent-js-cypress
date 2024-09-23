/*
 *  Copyright 2024 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const RPClient = require('@reportportal/client-javascript');
const clientHelpers = require('@reportportal/client-javascript/lib/helpers');

const { entityType, logLevels, testItemStatuses, cucumberKeywordMap } = require('./constants');
const {
  getScreenshotAttachment,
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  getAgentInfo,
  getCodeRef,
  getVideoFile,
  getSuiteStartObject,
  getSuiteEndObject,
} = require('./utils');

const { createMergeLaunchLockFile, deleteMergeLaunchLockFile } = require('./mergeLaunchesUtils');
const { mergeParallelLaunches } = require('./mergeLaunches');

const { FAILED } = testItemStatuses;

const promiseErrorHandler = (promise, message = '') =>
  promise.catch((err) => {
    console.error(message, err);
  });

const getInitialTestFinishParams = () => ({
  attributes: [],
  description: '',
});

class Reporter {
  constructor(config) {
    const agentInfo = getAgentInfo();
    this.client = new RPClient(config.reporterOptions, agentInfo);
    this.testItemIds = new Map();
    this.hooks = new Map();
    this.config = config.reporterOptions;
    this.fullCypressConfig = config;
    this.videoPromises = [];

    this.currentTestFinishParams = getInitialTestFinishParams();

    this.currentTestTempInfo = null;
    this.suitesStackTempInfo = [];
    this.suiteTestCaseIds = new Map();
    // TODO: use a single Map for test info
    this.pendingTestsIds = [];
    // TODO: use a single Map for suite info
    this.suiteStatuses = new Map();
    this.cucumberSteps = new Map();
  }

  saveFullConfig(config) {
    this.fullCypressConfig = config;
  }

  resetCurrentTestFinishParams() {
    this.currentTestFinishParams = getInitialTestFinishParams();
  }

  runStart(launchObj) {
    const { tempId, promise } = this.client.startLaunch(launchObj);
    const { launch, isLaunchMergeRequired } = this.config;
    if (isLaunchMergeRequired) {
      createMergeLaunchLockFile(launch, tempId);
    }
    promiseErrorHandler(promise, 'Fail to start launch');
    this.tempLaunchId = tempId;
  }

  runEnd() {
    const basePromise = this.config.launchId
      ? this.client.getPromiseFinishAllItems(this.tempLaunchId)
      : this.client.finishLaunch(
          this.tempLaunchId,
          Object.assign(
            {
              endTime: clientHelpers.now(),
            },
            this.launchStatus && { status: this.launchStatus },
          ),
        ).promise;

    const finishLaunchPromise = Promise.allSettled([basePromise, ...this.videoPromises])
      .then(() => {
        const { launch, isLaunchMergeRequired } = this.config;
        if (isLaunchMergeRequired) {
          deleteMergeLaunchLockFile(launch, this.tempLaunchId);
        }
      })
      .then(() => {
        const { parallel, autoMerge } = this.config;
        if (!(parallel && autoMerge)) {
          return Promise.resolve();
        }

        return mergeParallelLaunches(this.client, this.config);
      });
    return promiseErrorHandler(finishLaunchPromise, 'Fail to finish launch');
  }

  suiteStart(suite) {
    const parentId = suite.parentId && this.testItemIds.get(suite.parentId);
    const startSuiteObj = getSuiteStartObject(suite);
    const { tempId, promise } = this.client.startTestItem(
      startSuiteObj,
      this.tempLaunchId,
      parentId,
    );
    promiseErrorHandler(promise, 'Fail to start suite');
    this.testItemIds.set(suite.id, tempId);
    this.suitesStackTempInfo.push({
      tempId,
      startTime: suite.startTime,
      title: suite.title || '',
      id: suite.id,
      testFileName: suite.testFileName,
    });
  }

  suiteEnd(suite) {
    const { uploadVideo = false } = this.config;
    const { video: isVideoRecordingEnabled = false } = this.fullCypressConfig;
    const isRootSuite =
      this.suitesStackTempInfo.length && suite.id === this.suitesStackTempInfo[0].id;

    const suiteFinishObj = this.prepareSuiteToFinish(suite);

    if (isVideoRecordingEnabled && uploadVideo && isRootSuite) {
      const suiteInfo = this.suitesStackTempInfo[0];
      this.finishSuiteWithVideo(suiteInfo, suiteFinishObj);
    } else {
      const suiteTempId = this.testItemIds.get(suite.id);
      this.finishSuite(suiteFinishObj, suiteTempId);
    }
    this.suitesStackTempInfo.pop();
  }

  prepareSuiteToFinish(suite) {
    const suiteTestCaseId = this.suiteTestCaseIds.get(suite.title);
    const suiteStatus = this.suiteStatuses.get(suite.title);
    let suiteFinishObj = getSuiteEndObject(suite);

    suiteFinishObj = {
      ...suiteFinishObj,
      status: suiteStatus || suite.status,
      ...(suiteTestCaseId && { testCaseId: suiteTestCaseId }),
    };

    suiteTestCaseId && this.suiteTestCaseIds.delete(suite.title);
    suiteStatus && this.suiteStatuses.delete(suite.title);

    return suiteFinishObj;
  }

  finishSuite(suiteFinishObj, suiteTempId) {
    const finishTestItemPromise = this.client.finishTestItem(suiteTempId, suiteFinishObj).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish suite');
  }

  finishSuiteWithVideo(suiteInfo, suiteFinishObj) {
    const uploadVideoForNonFailedSpec = this.config.uploadVideoForNonFailedSpec || false;
    const suiteFailed = suiteFinishObj.status === testItemStatuses.FAILED;

    // do not upload video if root suite not failed and uploadVideoForNonFailedSpec is false
    if ((!suiteFailed && !uploadVideoForNonFailedSpec) || !suiteInfo.testFileName) {
      this.finishSuite(suiteFinishObj, suiteInfo.tempId);
    } else {
      const sendVideoPromise = this.sendVideo(suiteInfo).finally(() => {
        this.finishSuite(suiteFinishObj, suiteInfo.tempId);
      });
      this.videoPromises.push(sendVideoPromise);
    }
  }

  async sendVideo(suiteInfo) {
    const { waitForVideoTimeout, waitForVideoInterval, videosFolder, videoCompression } =
      this.config;
    const { testFileName, tempId, title } = suiteInfo;
    const file = await getVideoFile(
      testFileName,
      videoCompression,
      videosFolder,
      waitForVideoTimeout,
      waitForVideoInterval,
    );
    if (!file) {
      return null;
    }

    const sendVideoPromise = this.client.sendLog(
      tempId,
      {
        message: `Video: '${title}' (${testFileName}.mp4)`,
        level: logLevels.INFO,
        time: clientHelpers.now(),
      },
      file,
    ).promise;
    promiseErrorHandler(sendVideoPromise, 'Fail to save video');

    return sendVideoPromise;
  }

  testStart(test) {
    const parentId = this.testItemIds.get(test.parentId);
    const startTestObj = getTestStartObject(test);
    const { tempId, promise } = this.client.startTestItem(
      startTestObj,
      this.tempLaunchId,
      parentId,
    );
    promiseErrorHandler(promise, 'Fail to start test');
    this.testItemIds.set(test.id, tempId);
    this.currentTestTempInfo = {
      tempId,
      codeRef: test.codeRef,
      startTime: startTestObj.startTime,
      cucumberStepIds: new Set(),
    };
    if (this.pendingTestsIds.includes(test.id)) {
      this.testEnd(test);
      this.pendingTestsIds = this.pendingTestsIds.filter((id) => id !== test.id);
    }
  }

  sendLogOnFinishFailedItem(test, tempTestId) {
    if (test.status === FAILED) {
      const sendFailedLogPromise = this.client.sendLog(tempTestId, {
        message: test.err.stack,
        level: logLevels.ERROR,
        time: clientHelpers.now(),
      }).promise;
      promiseErrorHandler(sendFailedLogPromise, 'Fail to save error log');
    }
  }

  testEnd(test) {
    const testId = this.testItemIds.get(test.id);
    if (!testId) {
      return;
    }
    this.sendLogOnFinishFailedItem(test, testId);
    this.finishFailedStep(test);
    const testInfo = Object.assign({}, test, this.currentTestFinishParams);
    const finishTestItemPromise = this.client.finishTestItem(
      testId,
      getTestEndObject(testInfo, this.config.skippedIssue),
    ).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish test');
    this.resetCurrentTestFinishParams();
    this.currentTestTempInfo = null;
    this.testItemIds.delete(test.id);
  }

  testPending(test) {
    // if test has not been started, save test.id to finish in testStart().
    // if testStarted() has been called, call testEnd() directly.
    if (this.testItemIds.get(test.id)) {
      this.testEnd(test);
    } else {
      this.pendingTestsIds.push(test.id);
    }
  }

  cucumberStepStart(data) {
    const { testStepId, pickleStep } = data;
    const parent = this.currentTestTempInfo;

    if (!parent) return;

    const keyword = cucumberKeywordMap[pickleStep.type];
    const stepName = pickleStep.text;
    const codeRef = getCodeRef([stepName], parent.codeRef);

    const stepData = {
      name: keyword ? `${keyword} ${stepName}` : stepName,
      startTime: clientHelpers.now(),
      type: entityType.STEP,
      codeRef,
      hasStats: false,
    };

    const { tempId, promise } = this.client.startTestItem(
      stepData,
      this.tempLaunchId,
      parent.tempId,
    );
    promiseErrorHandler(promise, 'Fail to start step');
    this.cucumberSteps.set(testStepId, { tempId, tempParentId: parent.tempId, testStepId });
    parent.cucumberStepIds.add(testStepId);
  }

  finishFailedStep(test) {
    if (test.status === FAILED) {
      const step = this.getCurrentCucumberStep();

      if (!step) return;

      this.cucumberStepEnd({
        testStepId: step.testStepId,
        testStepResult: {
          status: testItemStatuses.FAILED,
          message: test.err.stack,
        },
      });
    }
  }

  cucumberStepEnd(data) {
    const { testStepId, testStepResult = { status: testItemStatuses.PASSED } } = data;
    const step = this.cucumberSteps.get(testStepId);

    if (!step) return;

    if (testStepResult.status === testItemStatuses.FAILED) {
      this.sendLog(step.tempId, {
        time: clientHelpers.now(),
        level: logLevels.ERROR,
        message: testStepResult.message,
      });
    }

    this.client.finishTestItem(step.tempId, {
      status: testStepResult.status,
      endTime: clientHelpers.now(),
    });

    this.cucumberSteps.delete(testStepId);
    if (this.currentTestTempInfo) {
      this.currentTestTempInfo.cucumberStepIds.delete(testStepId);
    }
  }

  hookStart(hook) {
    const hookStartObject = getHookStartObject(hook);
    switch (hookStartObject.type) {
      case entityType.BEFORE_SUITE:
        hookStartObject.startTime = this.getCurrentSuiteInfo().startTime - 1;
        break;
      case entityType.BEFORE_METHOD:
        hookStartObject.startTime = this.currentTestTempInfo
          ? this.currentTestTempInfo.startTime - 1
          : hookStartObject.startTime;
        break;
      default:
        break;
    }
    this.hooks.set(hook.id, hookStartObject);
  }

  hookEnd(hook) {
    const startedHook = this.hooks.get(hook.id);
    if (!startedHook) return;
    const { tempId, promise } = this.client.startTestItem(
      startedHook,
      this.tempLaunchId,
      this.testItemIds.get(hook.parentId),
    );
    promiseErrorHandler(promise, 'Fail to start hook');
    this.sendLogOnFinishFailedItem(hook, tempId);
    const finishHookPromise = this.client.finishTestItem(tempId, {
      status: hook.status,
      endTime: clientHelpers.now(),
    }).promise;
    this.hooks.delete(hook.id);
    promiseErrorHandler(finishHookPromise, 'Fail to finish hook');
  }

  getCurrentSuiteInfo() {
    return this.suitesStackTempInfo.length
      ? this.suitesStackTempInfo[this.suitesStackTempInfo.length - 1]
      : undefined;
  }

  getCurrentSuiteId() {
    const currentSuiteInfo = this.getCurrentSuiteInfo();
    return currentSuiteInfo && currentSuiteInfo.tempId;
  }

  getCurrentCucumberStep() {
    if (this.currentTestTempInfo && this.currentTestTempInfo.cucumberStepIds.size > 0) {
      const testStepId = Array.from(this.currentTestTempInfo.cucumberStepIds.values())[
        this.currentTestTempInfo.cucumberStepIds.size - 1
      ];

      return this.cucumberSteps.get(testStepId);
    }

    return null;
  }

  getCurrentCucumberStepId() {
    const step = this.getCurrentCucumberStep();

    return step && step.tempId;
  }

  sendLog(tempId, { level, message = '', file }) {
    return this.client.sendLog(
      tempId,
      {
        message,
        level,
        time: clientHelpers.now(),
      },
      file,
    ).promise;
  }

  sendLogToCurrentItem(log) {
    const tempItemId =
      this.getCurrentCucumberStepId() ||
      (this.currentTestTempInfo && this.currentTestTempInfo.tempId) ||
      this.getCurrentSuiteId();
    if (tempItemId) {
      const promise = this.sendLog(tempItemId, log);
      promiseErrorHandler(promise, 'Fail to send log to current item');
    }
  }

  sendLaunchLog(log) {
    const promise = this.sendLog(this.tempLaunchId, log);
    promiseErrorHandler(promise, 'Fail to send launch log');
  }

  addAttributes(attributes) {
    this.currentTestFinishParams.attributes = this.currentTestFinishParams.attributes.concat(
      attributes || [],
    );
  }

  setDescription(description) {
    this.currentTestFinishParams.description = description;
  }

  setTestCaseId({ testCaseId, suiteTitle }) {
    if (suiteTitle) {
      this.suiteTestCaseIds.set(suiteTitle, testCaseId);
    } else {
      Object.assign(this.currentTestFinishParams, testCaseId && { testCaseId });
    }
  }

  setTestItemStatus({ status, suiteTitle }) {
    if (suiteTitle) {
      this.suiteStatuses.set(suiteTitle, status);
      const rootSuite = this.suitesStackTempInfo.length && this.suitesStackTempInfo[0];
      if (rootSuite && status === testItemStatuses.FAILED) {
        this.suitesStackTempInfo[0].status = status;
      }
    } else {
      Object.assign(this.currentTestFinishParams, status && { status });
    }
  }

  setLaunchStatus({ status }) {
    this.launchStatus = status;
  }

  async sendScreenshot(screenshotInfo, logMessage) {
    const tempItemId = this.currentTestTempInfo && this.currentTestTempInfo.tempId;
    const fileName = screenshotInfo.path;

    if (!fileName || !tempItemId) {
      return;
    }

    const level = fileName && fileName.includes('(failed)') ? logLevels.ERROR : logLevels.INFO;
    const file = await getScreenshotAttachment(fileName);
    if (!file) {
      return;
    }

    const message = logMessage || `screenshot ${file.name}`;

    const sendScreenshotPromise = this.client.sendLog(
      tempItemId,
      {
        message,
        level,
        time: new Date(screenshotInfo.takenAt).valueOf(),
      },
      file,
    ).promise;
    promiseErrorHandler(sendScreenshotPromise, 'Fail to save screenshot.');
  }
}

module.exports = Reporter;

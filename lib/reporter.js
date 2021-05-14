/*
 *  Copyright 2020 EPAM Systems
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
const { entityType, testItemStatuses, logLevels } = require('./constants');
const {
  getFailedScreenshot,
  getPassedScreenshots,
  getCustomScreenshots,
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  getAgentInfo,
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
    this.config = config;

    this.currentTestFinishParams = getInitialTestFinishParams();

    this.currentTestTempInfo = null;
    this.suitesStackTempInfo = [];
    this.suiteTestCaseIds = new Map();
    this.currentTestCustomScreenshots = [];
    this.suiteStatuses = new Map();
  }

  resetCurrentTestFinishParams() {
    this.currentTestFinishParams = getInitialTestFinishParams();
  }

  runStart(launchObj) {
    const { tempId, promise } = this.client.startLaunch(launchObj);
    const { launch, isLaunchMergeRequired } = this.config.reporterOptions;
    if (isLaunchMergeRequired) {
      createMergeLaunchLockFile(launch, tempId);
    }
    promiseErrorHandler(promise, 'Fail to start launch');
    this.tempLaunchId = tempId;
  }

  runEnd() {
    const finishLaunchPromise = this.client
      .finishLaunch(
        this.tempLaunchId,
        Object.assign(
          {
            endTime: new Date().valueOf(),
          },
          this.launchStatus && { status: this.launchStatus },
        ),
      )
      .promise.then(() => {
        const { launch, isLaunchMergeRequired } = this.config.reporterOptions;
        if (isLaunchMergeRequired) {
          deleteMergeLaunchLockFile(launch, this.tempLaunchId);
        }
      })
      .then(() => {
        const { parallel, autoMerge } = this.config.reporterOptions;
        if (!(parallel && autoMerge)) {
          return Promise.resolve();
        }

        return mergeParallelLaunches(this.client, this.config);
      });
    return promiseErrorHandler(finishLaunchPromise, 'Fail to finish launch');
  }

  suiteStart(suite) {
    const parentId = suite.parentId && this.testItemIds.get(suite.parentId);
    const { tempId, promise } = this.client.startTestItem(suite, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start suite');
    this.testItemIds.set(suite.id, tempId);
    this.suitesStackTempInfo.push({ tempId, startTime: suite.startTime });
  }

  suiteEnd(suite) {
    const suiteId = this.testItemIds.get(suite.id);
    const suiteTestCaseId = this.suiteTestCaseIds.get(suite.title);
    const suiteStatus = this.suiteStatuses.get(suite.title);
    const finishTestItemPromise = this.client.finishTestItem(
      suiteId,
      Object.assign(
        {
          endTime: new Date().valueOf(),
        },
        suiteTestCaseId && { testCaseId: suiteTestCaseId },
        suiteStatus && { status: suiteStatus },
      ),
    ).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish suite');
    this.suitesStackTempInfo.pop();
    suiteTestCaseId && this.suiteTestCaseIds.delete(suite.title);
    suiteStatus && this.suiteStatuses.delete(suite.title);
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
    this.currentTestTempInfo = { tempId, startTime: startTestObj.startTime };
  }

  sendLogOnFinishItem(test, tempTestId) {
    const level = test.status === FAILED ? logLevels.ERROR : logLevels.INFO;

    if (test.status === FAILED) {
      const sendFailedLogPromise = this.client.sendLog(
        tempTestId,
        {
          message: test.err,
          level,
          time: new Date().valueOf(),
        },
        getFailedScreenshot(test.title),
      ).promise;
      promiseErrorHandler(sendFailedLogPromise, 'Fail to save error log');
    }
    const passedScreenshots = getPassedScreenshots(test.title);
    const customScreenshots = getCustomScreenshots(
      this.currentTestCustomScreenshots,
      test.testFileName,
    );

    passedScreenshots.concat(customScreenshots).forEach((file) => {
      const sendPassedScreenshotsPromise = this.client.sendLog(
        tempTestId,
        {
          message: 'screenshot',
          level,
          time: new Date().valueOf(),
        },
        file,
      ).promise;
      promiseErrorHandler(sendPassedScreenshotsPromise, 'Fail to save passed log');
    });
  }

  testEnd(test) {
    let testId = this.testItemIds.get(test.id);
    if (!testId) {
      this.testStart(test);
      testId = this.testItemIds.get(test.id);
    }
    this.sendLogOnFinishItem(test, testId);
    const testInfo = Object.assign({}, test, this.currentTestFinishParams);
    const finishTestItemPromise = this.client.finishTestItem(
      testId,
      getTestEndObject(testInfo, this.config.reporterOptions.skippedIssue),
    ).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish test');
    this.resetCurrentTestFinishParams();
    this.currentTestTempInfo = null;
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
    this.sendLogOnFinishItem(hook, tempId);
    const finishHookPromise = this.client.finishTestItem(tempId, {
      status: hook.status,
      endTime: new Date().valueOf(),
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

  sendLog(tempId, { level, message = '', file }) {
    this.client.sendLog(
      tempId,
      {
        message,
        level,
        time: new Date().valueOf(),
      },
      file,
    );
  }

  sendLogToCurrentItem(log) {
    const tempItemId =
      (this.currentTestTempInfo && this.currentTestTempInfo.tempId) || this.getCurrentSuiteId();
    tempItemId && this.sendLog(tempItemId, log);
  }

  sendLaunchLog(log) {
    this.sendLog(this.tempLaunchId, log);
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
    } else {
      Object.assign(this.currentTestFinishParams, status && { status });
    }
  }

  setLaunchStatus({ status }) {
    this.launchStatus = status;
  }

  saveCustomScreenshotFilename({ fileName }) {
    this.currentTestCustomScreenshots.push(fileName);
  }
}

module.exports = Reporter;

const RPClient = require('reportportal-client');
const { testItemStatuses, logLevels } = require('./constants');
const {
  getFailedScreenshot,
  getPassedScreenshots,
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  getAgentInfo,
} = require('./utils');

const { createMergeLaunchLockFile, deleteMergeLaunchLockFile } = require('./mergeLaunches');

const { FAILED } = testItemStatuses;

const promiseErrorHandler = (promise, message = '') =>
  promise.catch((err) => {
    console.error(message, err);
  });
class Reporter {
  constructor(config) {
    const agentInfo = getAgentInfo();
    this.client = new RPClient(config.reporterOptions, agentInfo);
    this.testItemIds = new Map();
    this.hooks = new Map();
    this.config = config;
    this.currentTestTempId = null;
    this.suitesStackTempId = [];
    this.currentTestAttributes = [];
    this.currentTestDescription = '';
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
      .finishLaunch(this.tempLaunchId, {
        endTime: new Date().valueOf(),
      })
      .promise.then(() => {
        const { launch, isLaunchMergeRequired } = this.config.reporterOptions;
        if (isLaunchMergeRequired) {
          deleteMergeLaunchLockFile(launch, this.tempLaunchId);
        }
      });

    return promiseErrorHandler(finishLaunchPromise, 'Fail to finish launch');
  }

  suiteStart(suite) {
    const parentId = suite.parentId && this.testItemIds.get(suite.parentId);
    const { tempId, promise } = this.client.startTestItem(suite, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start suite');
    this.testItemIds.set(suite.id, tempId);
    this.suitesStackTempId.push(tempId);
  }

  suiteEnd(suite) {
    const suiteId = this.testItemIds.get(suite.id);
    const finishTestItemPromise = this.client.finishTestItem(suiteId, {
      endTime: new Date().valueOf(),
    }).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish suite');
    this.suitesStackTempId.pop();
  }

  testStart(test) {
    const parentId = this.testItemIds.get(test.parentId);
    const { tempId, promise } = this.client.startTestItem(
      getTestStartObject(test),
      this.tempLaunchId,
      parentId,
    );
    promiseErrorHandler(promise, 'Fail to start test');
    this.testItemIds.set(test.id, tempId);
    this.currentTestTempId = tempId;
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

    passedScreenshots.forEach((file) => {
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
    const testInfo = Object.assign({}, test, {
      attributes: this.currentTestAttributes,
      description: this.currentTestDescription,
    });
    const finishTestItemPromise = this.client.finishTestItem(
      testId,
      getTestEndObject(testInfo, this.config.reporterOptions.skippedIssue),
    ).promise;
    promiseErrorHandler(finishTestItemPromise, 'Fail to finish test');
    this.currentTestAttributes = [];
    this.currentTestDescription = '';
    this.currentTestTempId = null;
  }

  hookStart(hook) {
    this.hooks.set(hook.id, getHookStartObject(hook));
  }

  hookEnd(hook) {
    const startedHook = this.hooks.get(hook.id);
    if (!startedHook) return;
    const parentId = this.testItemIds.get(hook.parentId);
    const { tempId, promise } = this.client.startTestItem(startedHook, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start hook');
    this.sendLogOnFinishItem(hook, tempId);
    this.hooks.delete(hook.id);
    const finishHookPromise = this.client.finishTestItem(tempId, {
      status: hook.status,
      endTime: new Date().valueOf(),
    }).promise;
    promiseErrorHandler(finishHookPromise, 'Fail to finish hook');
  }

  getCurrentSuiteId() {
    return this.suitesStackTempId.length
      ? this.suitesStackTempId[this.suitesStackTempId.length - 1]
      : undefined;
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
    const tempItemId = this.currentTestTempId || this.getCurrentSuiteId();
    tempItemId && this.sendLog(tempItemId, log);
  }

  sendLaunchLog(log) {
    this.sendLog(this.tempLaunchId, log);
  }

  addAttributes(attributes) {
    this.currentTestAttributes = this.currentTestAttributes.concat(attributes || []);
  }

  setDescription(description) {
    this.currentTestDescription = description;
  }
}

module.exports = Reporter;

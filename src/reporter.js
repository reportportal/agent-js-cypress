const RPClient = require('reportportal-client');
const { testItemStatuses, logLevels } = require('./constants');
const { getFailedScreenshot, getPassedScreenshots } = require('./utils');

const { FAILED } = testItemStatuses;

const promiseErrorHandler = (promise, message = '') =>
  promise.catch((err) => {
    console.error(message, err);
  });
class Reporter {
  constructor(config) {
    this.client = new RPClient(config.reporterOptions);
    this.testItemIds = new Map();
    this.hooksForTest = new Map();
    this.hooks = new Map();
    this.config = config;
  }

  runStart(launch) {
    const { tempId, promise } = this.client.startLaunch(launch);
    promiseErrorHandler(promise, 'Fail to start launch');
    this.tempLaunchId = tempId;
  }

  runEnd() {
    return promiseErrorHandler(
      this.client.finishLaunch(this.tempLaunchId, {
        endTime: new Date().valueOf(),
      }).promise,
      'Fail to finish launch',
    );
  }

  suiteStart(suite) {
    const parentId = suite.parentId && this.testItemIds.get(suite.parentId);
    const { tempId, promise } = this.client.startTestItem(suite, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start suite');
    this.testItemIds.set(suite.id, tempId);
  }

  suiteEnd(suite) {
    const suiteId = this.testItemIds.get(suite.id);
    promiseErrorHandler(this.client.finishTestItem(suiteId, {}).promise, 'Fail to finish suite');
  }

  testStart(test) {
    const parentId = this.testItemIds.get(test.parentId);
    const { tempId, promise } = this.client.startTestItem(test, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start test');
    this.testItemIds.set(test.id, tempId);
  }

  sendLog(test, tempTestId, logTime) {
    const level = test.status === FAILED ? logLevels.ERROR : logLevels.INFO;

    if (test.status === FAILED) {
      promiseErrorHandler(
        this.client.sendLog(
          tempTestId,
          {
            message: test.error,
            level,
            time: logTime || new Date().valueOf(),
          },
          getFailedScreenshot(test.title),
        ).promise,
        'Fail to save error log',
      );
    }
    const passedScreenshots = getPassedScreenshots(test.title);

    passedScreenshots.forEach((file) =>
      promiseErrorHandler(
        this.client.sendLog(
          tempTestId,
          {
            message: 'screenshot',
            level,
            time: logTime || new Date().valueOf(),
          },
          file,
        ).promise,
        'Fail to save passed log',
      ),
    );
  }

  testEnd(test) {
    let testId = this.testItemIds.get(test.id);
    if (!testId) {
      this.testStart({ ...test, startTime: new Date().valueOf() });
      testId = this.testItemIds.get(test.id);
    }
    this.sendLog(test, testId);
    promiseErrorHandler(this.client.finishTestItem(testId, test).promise, 'Fail to finish test');
  }

  hookStart(hook) {
    this.hooks.set(hook.id, hook);
  }

  hookEnd(hook) {
    const startedHook = this.hooks.get(hook.id);
    if (!startedHook) return;
    const parentId = this.testItemIds.get(startedHook.parentId);
    const { tempId, promise } = this.client.startTestItem(startedHook, this.tempLaunchId, parentId);
    promiseErrorHandler(promise, 'Fail to start hook');
    this.sendLog(hook, tempId, startedHook.startTime);
    this.hooks.delete(hook.id);
    promiseErrorHandler(this.client.finishTestItem(tempId, hook).promise, 'Fail to finish hook');
  }
}

module.exports = Reporter;

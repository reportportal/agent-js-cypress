const Mocha = require('mocha');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_FAIL,
} = Mocha.Runner.constants;
const RPClient = require('reportportal-client');
const { testItemStatuses, logLevels, entityType, hookTypesMap } = require('./constants');
const { getFailedScreenshot, getPassedScreenshots } = require('./utils');

const { FAILED, SKIPPED, PASSED } = testItemStatuses;

const getHookId = (test) => `${test.hookId}_${test.id}`;

class ReportPortalReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.client = new RPClient(config.reporterOptions);
    this.testItemIds = new Map();
    this.hooksForTest = new Map();
    this.hooks = new Map();

    runner.on(EVENT_RUN_BEGIN, async () => {
      try {
        const launch = {
          token: config.reporterOptions.token,
          name: config.reporterOptions.launch,
          description: config.reporterOptions.description,
          attributes: config.reporterOptions.attributes,
          rerun: config.reporterOptions.rerun,
          rerunOf: config.reporterOptions.rerunOf,
          startTime: new Date().valueOf(),
        };

        const { tempId, promise } = this.client.startLaunch(launch);

        this.tempLaunchId = tempId;
        await promise;
      } catch (err) {
        console.error(`Failed to run launch. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => this.suiteStart(suite));

    runner.on(EVENT_SUITE_END, (suite) => this.suiteEnd(suite));

    runner.on(EVENT_TEST_BEGIN, async (test) => {
      try {
        await this.testStart(test);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, async (test) => {
      let status = test.state === 'pending' || test.failedFromHookId ? SKIPPED : test.state;
      try {
        const tempTestId = this.testItemIds.get(test.id);
        //  skipped test for failed hook
        if (!tempTestId) {
          await this.testStart(test);
          status = SKIPPED;
        }
        this.testFinish(test, status);
      } catch (err) {
        console.error(`Failed to start skipped test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_RUN_END, async () => {
      try {
        const { promise } = this.client.finishLaunch(this.tempLaunchId, {
          endTime: new Date().valueOf(),
        });
        await promise;
      } catch (err) {
        console.error(`Failed to finish run. Error: ${err}`);
      }
    });
    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.hookStart(hook);
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.hookFinish(hook).catch((err) => {
        console.error(`Failed to finish hook. Error: ${err}`);
      });
    });

    runner.on(EVENT_TEST_FAIL, async (test, err) => {
      if (test.failedFromHookId) {
        const testHook = this.hooks.get(`${test.failedFromHookId}_${test.id}`);
        if (testHook) {
          this.hookFinish({ ...testHook, state: FAILED, err });
        }
        this.testFinish(test, FAILED);
      }
    });
  }

  suiteStart(suite) {
    if (!suite.title) {
      return;
    }
    const suiteStartObj = {
      type: entityType.SUITE,
      name: suite.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      description: suite.description,
      attributes: [],
    };
    const parentId = !suite.root ? this.testItemIds.get(suite.parent.id) : undefined;

    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parentId,
    );
    this.testItemIds.set(suite.id, tempId);
    promise.catch((err) => {
      console.error(`Failed to create suite. Error: ${err}`);
    });
  }

  suiteEnd(suite) {
    if (!suite.title) {
      return;
    }
    const suiteId = this.testItemIds.get(suite.id);
    this.client.finishTestItem(suiteId, {}).promise.catch((err) => {
      console.error(`Failed to finish suite. Error: ${err}`);
    });
  }

  async testStart(test) {
    const parentId = this.testItemIds.get(test.parent.id);
    const testStartObj = {
      type: entityType.STEP,
      name: test.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      attributes: [],
    };

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.testItemIds.set(test.id, tempId);
    await promise;
  }

  async sendLog(test, tempTestId, logTime) {
    const level = test.state === FAILED ? logLevels.ERROR : logLevels.INFO;

    if (test.state === FAILED) {
      await this.client.sendLog(
        tempTestId,
        {
          message: test.err.message,
          level,
          time: logTime || new Date().valueOf(),
        },
        getFailedScreenshot(test.title),
      ).promise;
    }
    const passedScreenshots = getPassedScreenshots(test.title);

    Promise.all(
      passedScreenshots.map(
        (file) =>
          this.client.sendLog(
            tempTestId,
            {
              message: 'screenshot',
              level,
              time: logTime || new Date().valueOf(),
            },
            file,
          ).promise,
      ),
    );
  }

  async testFinish(test, status) {
    const testId = this.testItemIds.get(test.id);
    if (!testId) return;
    await this.sendLog(test, testId);
    this.client
      .finishTestItem(testId, {
        endTime: new Date().valueOf(),
        status,
      })
      .promise.catch((err) => {
        console.error(`Failed to finish test item. Error: ${err}`);
      });
    this.testItemIds.delete(test.id);
  }

  hookStart(hook) {
    this.hooks.set(getHookId(hook), { ...hook, startTime: new Date().valueOf() });
  }

  async hookFinish(hook) {
    const hookId = getHookId(hook);
    const testHooks = this.hooks.get(hookId);
    if (!testHooks) return;
    const parentId = this.testItemIds.get(hook.parent.id);

    const hookRPType = hookTypesMap[hook.hookName];
    const hookName = hook.title.replace(`"${hook.hookName}" hook:`, '').trim();
    const { tempId, promise } = this.client.startTestItem(
      {
        name: hookName,
        startTime: testHooks.startTime,
        type: hookRPType,
      },
      this.tempLaunchId,
      parentId,
    );

    await promise;
    await this.sendLog(hook, tempId, testHooks.startTime);
    this.hooks.delete(hookId);
    this.client.finishTestItem(tempId, {
      status: hook.state === FAILED ? FAILED : PASSED,
      endTime: new Date().valueOf(),
    });
  }
}

module.exports = ReportPortalReporter;

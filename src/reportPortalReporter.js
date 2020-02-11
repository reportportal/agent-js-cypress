const Mocha = require('mocha');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
} = Mocha.Runner.constants;
const RPClient = require('reportportal-client');
const { testItemStatuses, logLevels, entityType } = require('./constants');
const { getFailedScreenshot, getPassedScreenshots } = require('./utils');

const { FAILED, SKIPPED } = testItemStatuses;

class ReportPortalReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.client = new RPClient(config.reporterOptions);
    this.testItemIds = new Map();

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

    runner.on(EVENT_SUITE_BEGIN, async (suite) => {
      try {
        await this.suiteStart(suite);
      } catch (err) {
        console.error(`Failed to create suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_END, async (suite) => {
      try {
        await this.suiteEnd(suite);
      } catch (err) {
        console.error(`Failed to finish suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_BEGIN, async (test) => {
      try {
        await this.testStart(test);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, async (test) => {
      const status = test.state === 'pending' ? SKIPPED : test.state;
      try {
        await this.sendLog(test);
        await this.testFinish(test, { status });
      } catch (err) {
        console.error(`Failed to finish failed test item. Error: ${err}`);
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
  }

  async suiteStart(suite) {
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
    await promise;
  }

  async suiteEnd(suite) {
    if (!suite.title) {
      return;
    }
    const suiteId = this.testItemIds.get(suite.id);
    const { promise } = this.client.finishTestItem(suiteId, {});

    await promise;
  }

  async testStart(test) {
    if (!test.title) {
      return;
    }
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

  async sendLog(test) {
    const testId = this.testItemIds.get(test.id);
    const level = test.state === FAILED ? logLevels.ERROR : logLevels.INFO;

    if (test.state === FAILED) {
      await this.client.sendLog(
        testId,
        {
          message: test.err.stack,
          level,
          time: new Date().valueOf(),
        },
        getFailedScreenshot(test.title),
      ).promise;
    }
    const passedScreenshots = getPassedScreenshots(test.title);

    await Promise.all(
      passedScreenshots.map(
        (file) =>
          this.client.sendLog(
            testId,
            {
              message: 'screenshot',
              level,
              time: new Date().valueOf(),
            },
            file,
          ).promise,
      ),
    );
  }

  async testFinish(test, finishTestObj) {
    const testId = this.testItemIds.get(test.id);
    const { promise } = this.client.finishTestItem(testId, {
      endTime: new Date().valueOf(),
      ...finishTestObj,
    });

    await promise;
  }
}

module.exports = ReportPortalReporter;

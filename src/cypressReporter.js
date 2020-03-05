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
const { fork } = require('child_process');
const { reporterEvents, testItemStatuses } = require('./constants');
const {
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getHookInfo,
} = require('./utils');

const { FAILED } = testItemStatuses;

class CypressReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.worker = fork(`${__dirname}/worker.js`, [], {
      detached: true,
    });
    this.worker.send({ event: reporterEvents.INIT, config });

    runner.on(EVENT_RUN_BEGIN, () => {
      this.worker.send({
        event: EVENT_RUN_BEGIN,
        launch: getLaunchStartObject(config),
      });
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      if (!suite.title) return;
      this.worker.send({
        event: EVENT_SUITE_BEGIN,
        suite: getSuiteStartObject(suite),
      });
    });

    runner.on(EVENT_SUITE_END, (suite) => {
      if (!suite.title) return;
      this.worker.send({ event: EVENT_SUITE_END, suite: getSuiteEndObject(suite) });
    });

    runner.on(EVENT_TEST_BEGIN, (test) =>
      this.worker.send({ event: EVENT_TEST_BEGIN, test: getTestInfo(test) }),
    );

    runner.on(EVENT_TEST_END, (test) => {
      this.worker.send({ event: EVENT_TEST_END, test: getTestInfo(test) });
    });

    runner.on(EVENT_RUN_END, () =>
      this.worker.send({ event: EVENT_RUN_END, launch: getLaunchStartObject(config) }),
    );

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_BEGIN, hook: getHookInfo(hook) });
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_END, hook: getHookInfo(hook) });
    });

    runner.on(EVENT_TEST_FAIL, (test, err) => {
      if (test.failedFromHookId && config.reporterOptions.reportHooks) {
        this.worker.send({
          event: EVENT_HOOK_END,
          hook: getHookInfo(test, FAILED, err),
        });
        this.worker.send({
          event: EVENT_TEST_END,
          test: getTestInfo(test, FAILED, err),
        });
      }
    });
  }
}

module.exports = CypressReporter;

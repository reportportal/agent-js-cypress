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
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  getHookEndObject,
} = require('./utils');

const { FAILED, SKIPPED } = testItemStatuses;

class CypressReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.forkedEventListener = fork(`${__dirname}/forkedEventListener.js`, [], {
      detached: true,
    });
    this.forkedEventListener.send({ event: reporterEvents.INIT, config });

    runner.on(EVENT_RUN_BEGIN, () => {
      this.forkedEventListener.send({
        event: EVENT_RUN_BEGIN,
        launch: getLaunchStartObject(config),
      });
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      if (!suite.title) return;
      this.forkedEventListener.send({
        event: EVENT_SUITE_BEGIN,
        suite: getSuiteStartObject(suite),
      });
    });

    runner.on(EVENT_SUITE_END, (suite) => {
      if (!suite.title) return;
      this.forkedEventListener.send({ event: EVENT_SUITE_END, suite: getSuiteEndObject(suite) });
    });

    runner.on(EVENT_TEST_BEGIN, (test) =>
      this.forkedEventListener.send({ event: EVENT_TEST_BEGIN, test: getTestStartObject(test) }),
    );

    runner.on(EVENT_TEST_END, (test) => {
      const status = test.state === 'pending' || test.failedFromHookId ? SKIPPED : test.state;
      const testObj = getTestEndObject(test, status);
      this.forkedEventListener.send({ event: EVENT_TEST_END, test: testObj });
    });

    runner.on(EVENT_RUN_END, () =>
      this.forkedEventListener.send({ event: EVENT_RUN_END, launch: getLaunchStartObject(config) }),
    );

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.forkedEventListener.send({ event: EVENT_HOOK_BEGIN, hook: getHookStartObject(hook) });
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.forkedEventListener.send({ event: EVENT_HOOK_END, hook: getHookEndObject(hook) });
    });

    runner.on(EVENT_TEST_FAIL, (test, err) => {
      if (test.failedFromHookId && config.reporterOptions.reportHooks) {
        this.forkedEventListener.send({
          event: EVENT_HOOK_END,
          hook: getHookEndObject(test, FAILED, err),
        });
        this.forkedEventListener.send({
          event: EVENT_TEST_END,
          test: getTestEndObject(test, FAILED, err),
        });
      }
    });
  }
}

module.exports = CypressReporter;

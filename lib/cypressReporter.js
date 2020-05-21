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
const { startIPCServer } = require('./ipcServer');
const { reporterEvents, testItemStatuses } = require('./constants');
const { IPC_EVENTS } = require('./ipcEvents');
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
    const testFileName = runner.suite.file;
    this.worker = fork(`${__dirname}/worker.js`, [], {
      detached: true,
    });
    this.worker.send({ event: reporterEvents.INIT, config });
    startIPCServer((server) => {
      server.on(IPC_EVENTS.LOG, (log) => {
        this.worker.send({ event: reporterEvents.LOG, log });
      });
      server.on(IPC_EVENTS.LAUNCH_LOG, (log) => {
        this.worker.send({ event: reporterEvents.LAUNCH_LOG, log });
      });
      server.on(IPC_EVENTS.ADD_ATTRIBUTES, ({ attributes }) => {
        this.worker.send({ event: reporterEvents.ADD_ATTRIBUTES, attributes });
      });
      server.on(IPC_EVENTS.SET_DESCRIPTION, ({ description }) => {
        this.worker.send({ event: reporterEvents.SET_DESCRIPTION, description });
      });
      server.on(IPC_EVENTS.SET_TEST_CASE_ID, (testCaseIdInfo) => {
        this.worker.send({ event: reporterEvents.SET_TEST_CASE_ID, testCaseIdInfo });
      });
      server.on(IPC_EVENTS.CUSTOM_SCREENSHOT, (screenshotInfo) => {
        this.worker.send({ event: reporterEvents.CUSTOM_SCREENSHOT, screenshotInfo });
      });
      server.on(IPC_EVENTS.SET_STATUS, (statusInfo) => {
        this.worker.send({ event: reporterEvents.SET_STATUS, statusInfo });
      });
      server.on(IPC_EVENTS.SET_LAUNCH_STATUS, (statusInfo) => {
        this.worker.send({ event: reporterEvents.SET_LAUNCH_STATUS, statusInfo });
      });
    });

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
        suite: getSuiteStartObject(suite, testFileName),
      });
    });

    runner.on(EVENT_SUITE_END, (suite) => {
      if (!suite.title) return;
      this.worker.send({ event: EVENT_SUITE_END, suite: getSuiteEndObject(suite) });
    });

    runner.on(EVENT_TEST_BEGIN, (test) => {
      this.worker.send({ event: EVENT_TEST_BEGIN, test: getTestInfo(test, testFileName) });
    });

    runner.on(EVENT_TEST_END, (test) => {
      this.worker.send({ event: EVENT_TEST_END, test: getTestInfo(test, testFileName) });
    });

    runner.on(EVENT_RUN_END, () =>
      this.worker.send({ event: EVENT_RUN_END, launch: getLaunchStartObject(config) }),
    );

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_BEGIN, hook: getHookInfo(hook, testFileName) });
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_END, hook: getHookInfo(hook, testFileName) });
    });

    runner.on(EVENT_TEST_FAIL, (test, err) => {
      if (test.failedFromHookId && config.reporterOptions.reportHooks) {
        this.worker.send({
          event: EVENT_HOOK_END,
          hook: getHookInfo(test, testFileName, FAILED, err),
        });
        this.worker.send({
          event: EVENT_TEST_END,
          test: getTestInfo(test, testFileName, FAILED, err),
        });
      }
    });
  }
}

module.exports = CypressReporter;

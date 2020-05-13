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
const glob = require('glob');
const { startIPCServer } = require('./ipcServer');
const { reporterEvents, testItemStatuses } = require('./constants');
const { IPC_EVENTS } = require('./ipcEvents');
const {
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getHookInfo,
  getTotalSpecs,
} = require('./utils');

const { FAILED } = testItemStatuses;

class CypressReporter extends Mocha.reporters.Base {
  static currentLaunch = 0;
  static totalLaunches = 0;
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    CypressReporter.currentLaunch += 1;
    CypressReporter.reporterOptions = config.reporterOptions;

    if (this.isFirstRun() || !config.reporterOptions.autoMerge) {
      this.worker = fork(`${__dirname}/worker.js`, [], {
        detached: true,
      });
      this.worker.send({ event: reporterEvents.INIT, config });
      startIPCServer((server) => {
        server.on(IPC_EVENTS.CONFIG, (cypressFullConfig) => {
          CypressReporter.cypressConfig = cypressFullConfig;
          this.calcTotalLaunches();
        });
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
      CypressReporter.worker = this.worker;
    } else {
      this.worker = CypressReporter.worker;
    }

    this.runner.on(EVENT_RUN_BEGIN, () => {
      if (this.shouldStartlaunch()) {
        this.worker.send({
          event: EVENT_RUN_BEGIN,
          launch: getLaunchStartObject(config),
        });
      }
    });

    this.runner.on(EVENT_SUITE_BEGIN, (suite) => {
      if (!suite.title) return;
      this.worker.send({
        event: EVENT_SUITE_BEGIN,
        suite: getSuiteStartObject(suite, this.runner.suite.file),
      });
    });

    this.runner.on(EVENT_SUITE_END, (suite) => {
      if (!suite.title) return;
      this.worker.send({ event: EVENT_SUITE_END, suite: getSuiteEndObject(suite) });
    });

    this.runner.on(EVENT_TEST_BEGIN, (test) => {
      this.worker.send({ event: EVENT_TEST_BEGIN, test: getTestInfo(test, this.runner.suite.file) });
    });

    this.runner.on(EVENT_TEST_END, (test) => {
      this.worker.send({ event: EVENT_TEST_END, test: getTestInfo(test, this.runner.suite.file) });
    });

    this.runner.on(EVENT_RUN_END, () => {
      this.calcTotalLaunches();
      if (this.shouldStopLaunch()) {
        this.worker.send({ event: EVENT_RUN_END, launch: getLaunchStartObject(config) });
      }
    });

    this.runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_BEGIN, hook: getHookInfo(hook, this.runner.suite.file) });
    });

    this.runner.on(EVENT_HOOK_END, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({ event: EVENT_HOOK_END, hook: getHookInfo(hook, this.runner.suite.file) });
    });

    this.runner.on(EVENT_TEST_FAIL, (test, err) => {
      if (test.failedFromHookId && config.reporterOptions.reportHooks) {
        this.worker.send({
          event: EVENT_HOOK_END,
          hook: getHookInfo(test, this.runner.suite.file, FAILED, err),
        });
        this.worker.send({
          event: EVENT_TEST_END,
          test: getTestInfo(test, this.runner.suite.file, FAILED, err),
        });
      }
    });
  }

  calcTotalLaunches() {
    if (!CypressReporter.reporterOptions.autoMerge || CypressReporter.totalLaunches) return;
    if (CypressReporter.cypressConfig){
      CypressReporter.totalLaunches = getTotalSpecs(CypressReporter.cypressConfig);
    } else {
      console.log('Auto merge: plugin is not installed. Use reporterOptions settings for calculation.');
      CypressReporter.totalLaunches = getTotalSpecs(CypressReporter.reporterOptions);
    }
  }

  shouldStopLaunch() {
    return !CypressReporter.totalLaunches || CypressReporter.currentLaunch === CypressReporter.totalLaunches || !CypressReporter.reporterOptions.autoMerge;
  }

  shouldStartlaunch() {
    return this.isFirstRun() || !CypressReporter.totalLaunches || !CypressReporter.reporterOptions.autoMerge;
  }

  isFirstRun() {
    return CypressReporter.currentLaunch === 1;
  }
}

module.exports = CypressReporter;

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
  getConfig,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getHookInfo,
  getTotalSpecs,
} = require('./utils');

const { FAILED } = testItemStatuses;

class CypressReporter extends Mocha.reporters.Base {
  constructor(runner, initialConfig) {
    super(runner);
    this.runner = runner;
    const config = getConfig(initialConfig);
    CypressReporter.currentLaunch += 1;
    CypressReporter.reporterOptions = config.reporterOptions;

    if (
      CypressReporter.isFirstRun() ||
      !config.reporterOptions.autoMerge ||
      CypressReporter.reporterOptions.parallel
    ) {
      this.worker = fork(`${__dirname}/worker.js`, [], {
        detached: true,
      });
      this.worker.send({ event: reporterEvents.INIT, config });

      const configListener = (cypressFullConfig) => {
        CypressReporter.cypressConfig = cypressFullConfig;
        CypressReporter.calcTotalLaunches();
      };
      const logListener = (log) => this.worker.send({ event: reporterEvents.LOG, log });
      const launchLogListener = (log) =>
        this.worker.send({ event: reporterEvents.LAUNCH_LOG, log });
      const attributesListener = ({ attributes }) =>
        this.worker.send({ event: reporterEvents.ADD_ATTRIBUTES, attributes });
      const descriptionListener = ({ description }) =>
        this.worker.send({ event: reporterEvents.SET_DESCRIPTION, description });
      const testCaseId = (testCaseIdInfo) =>
        this.worker.send({ event: reporterEvents.SET_TEST_CASE_ID, testCaseIdInfo });
      const screenshotListener = (screenshotInfo) =>
        this.worker.send({ event: reporterEvents.CUSTOM_SCREENSHOT, screenshotInfo });
      const setStatusListener = (statusInfo) =>
        this.worker.send({ event: reporterEvents.SET_STATUS, statusInfo });
      const setLaunchStatusListener = (statusInfo) =>
        this.worker.send({ event: reporterEvents.SET_LAUNCH_STATUS, statusInfo });

      startIPCServer(
        (server) => {
          server.on(IPC_EVENTS.CONFIG, configListener);
          server.on(IPC_EVENTS.LOG, logListener);
          server.on(IPC_EVENTS.LAUNCH_LOG, launchLogListener);
          server.on(IPC_EVENTS.ADD_ATTRIBUTES, attributesListener);
          server.on(IPC_EVENTS.SET_DESCRIPTION, descriptionListener);
          server.on(IPC_EVENTS.SET_TEST_CASE_ID, testCaseId);
          server.on(IPC_EVENTS.CUSTOM_SCREENSHOT, screenshotListener);
          server.on(IPC_EVENTS.SET_STATUS, setStatusListener);
          server.on(IPC_EVENTS.SET_LAUNCH_STATUS, setLaunchStatusListener);
        },
        (server) => {
          server.off(IPC_EVENTS.CONFIG, '*');
          server.off(IPC_EVENTS.LOG, '*');
          server.off(IPC_EVENTS.LAUNCH_LOG, '*');
          server.off(IPC_EVENTS.ADD_ATTRIBUTES, '*');
          server.off(IPC_EVENTS.SET_DESCRIPTION, '*');
          server.off(IPC_EVENTS.SET_TEST_CASE_ID, '*');
          server.off(IPC_EVENTS.CUSTOM_SCREENSHOT, '*');
          server.off(IPC_EVENTS.SET_STATUS, '*');
          server.off(IPC_EVENTS.SET_LAUNCH_STATUS, '*');
        },
      );
      CypressReporter.worker = this.worker;
    } else {
      this.worker = CypressReporter.worker;
    }

    this.runner.on(EVENT_RUN_BEGIN, () => {
      if (CypressReporter.shouldStartLaunch()) {
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
      this.worker.send({
        event: EVENT_TEST_BEGIN,
        test: getTestInfo(test, this.runner.suite.file),
      });
    });

    this.runner.on(EVENT_TEST_END, (test) => {
      this.worker.send({ event: EVENT_TEST_END, test: getTestInfo(test, this.runner.suite.file) });
    });

    this.runner.on(EVENT_RUN_END, () => {
      CypressReporter.calcTotalLaunches();
      if (CypressReporter.shouldStopLaunch()) {
        this.worker.send({ event: EVENT_RUN_END, launch: getLaunchStartObject(config) });
      }
    });

    this.runner.on(EVENT_HOOK_BEGIN, (hook) => {
      if (!config.reporterOptions.reportHooks) return;
      this.worker.send({
        event: EVENT_HOOK_BEGIN,
        hook: getHookInfo(hook, this.runner.suite.file),
      });
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

  static calcTotalLaunches() {
    if (
      !CypressReporter.reporterOptions.autoMerge ||
      CypressReporter.totalLaunches ||
      CypressReporter.reporterOptions.parallel
    ) {
      return;
    }
    if (CypressReporter.cypressConfig) {
      CypressReporter.totalLaunches = getTotalSpecs(CypressReporter.cypressConfig);
    } else {
      console.log(
        'Auto merge: plugin is not installed. Use reporterOptions settings for calculation.',
      );
      CypressReporter.totalLaunches = getTotalSpecs(CypressReporter.reporterOptions);
    }
  }

  static shouldStopLaunch() {
    return (
      !CypressReporter.totalLaunches ||
      CypressReporter.currentLaunch === CypressReporter.totalLaunches ||
      !CypressReporter.reporterOptions.autoMerge ||
      CypressReporter.reporterOptions.parallel
    );
  }

  static shouldStartLaunch() {
    return (
      CypressReporter.isFirstRun() ||
      !CypressReporter.totalLaunches ||
      !CypressReporter.reporterOptions.autoMerge ||
      CypressReporter.reporterOptions.parallel
    );
  }

  static isFirstRun() {
    return CypressReporter.currentLaunch === 1;
  }
}

CypressReporter.currentLaunch = 0;
CypressReporter.totalLaunches = 0;

module.exports = CypressReporter;

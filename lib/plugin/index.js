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

const ipc = require('node-ipc');
const { connectIPCClient } = require('./ipcClient');
const { IPC_EVENTS } = require('./../ipcEvents');

let screenshotLogFn;

const registerReportPortalPlugin = (on, config) => {
  if (config.screenshotLogFn && typeof config.screenshotLogFn === 'function') {
    screenshotLogFn = config.screenshotLogFn;
  }
  // eslint-disable-next-line no-param-reassign
  delete config.screenshotLogFn;

  connectIPCClient(config);

  on('task', {
    rp_Log(log) {
      ipc.of.reportportal.emit(IPC_EVENTS.LOG, log);
      return null;
    },
    rp_launchLog(log) {
      ipc.of.reportportal.emit(IPC_EVENTS.LAUNCH_LOG, log);
      return null;
    },
    rp_addTestAttributes(attributes) {
      ipc.of.reportportal.emit(IPC_EVENTS.ADD_ATTRIBUTES, attributes);
      return null;
    },
    rp_setTestDescription(description) {
      ipc.of.reportportal.emit(IPC_EVENTS.SET_DESCRIPTION, description);
      return null;
    },
    rp_setTestCaseId(testCaseIdInfo) {
      ipc.of.reportportal.emit(IPC_EVENTS.SET_TEST_CASE_ID, testCaseIdInfo);
      return null;
    },
    rp_setStatus(statusInfo) {
      ipc.of.reportportal.emit(IPC_EVENTS.SET_STATUS, statusInfo);
      return null;
    },
    rp_setLaunchStatus(statusInfo) {
      ipc.of.reportportal.emit(IPC_EVENTS.SET_LAUNCH_STATUS, statusInfo);
      return null;
    },
  });

  on('after:screenshot', (details) => {
    if (screenshotLogFn) {
      // eslint-disable-next-line no-param-reassign
      details.logMessage = screenshotLogFn(details);
    }
    ipc.of.reportportal.emit(IPC_EVENTS.SCREENSHOT, details);
    return null;
  });
};

module.exports = registerReportPortalPlugin;

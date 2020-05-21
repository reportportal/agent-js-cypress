const ipc = require('node-ipc');
const { connectIPCClient } = require('./ipcClient');
const { IPC_EVENTS } = require('./../ipcEvents');

const registerReportPortalPlugin = (on) => {
  connectIPCClient();

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
    rp_screenshot(screenshotInfo) {
      ipc.of.reportportal.emit(IPC_EVENTS.CUSTOM_SCREENSHOT, screenshotInfo);
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
};

module.exports = registerReportPortalPlugin;

const fs = require('fs');
const glob = require('glob');
const RPClient = require('reportportal-client');

const LAUNCH_LOCK_FILE_PREFIX = 'rplaunchinprogress';
const DEFAULT_MAX_LOCK_TIMEOUT = 3600000; // 1 hour
const CHECK_IN_PROGRESS_INTERVAL = 3000;

const getLaunchLockFileName = (launchName, tempId) =>
  `${LAUNCH_LOCK_FILE_PREFIX}-${launchName}-${tempId}.tmp`;

const createMergeLaunchLockFile = (launchName, tempId) => {
  const filename = getLaunchLockFileName(launchName, tempId);
  fs.open(filename, 'w', (err) => {
    if (err) {
      throw err;
    }
  });
};

const deleteMergeLaunchLockFile = (launchName, tempId) => {
  const filename = getLaunchLockFileName(launchName, tempId);
  fs.unlink(filename, (err) => {
    if (err) {
      throw err;
    }
  });
};

const isLaunchesInProgress = (launchName) => {
  const files = glob.sync(`${LAUNCH_LOCK_FILE_PREFIX}-${launchName}-*.tmp`);
  return !!files.length;
};

const callClientMergeLaunches = (reporterOptions) => {
  const client = new RPClient(reporterOptions);
  return client.mergeLaunches();
};

const mergeLaunches = (reporterOptions) => {
  if (!isLaunchesInProgress(reporterOptions.launch)) {
    return callClientMergeLaunches(reporterOptions);
  }
  return new Promise((resolve, reject) => {
    let mergeMaxWaitTimeout;
    const checkInterval = setInterval(() => {
      if (!isLaunchesInProgress(reporterOptions.launch)) {
        mergeMaxWaitTimeout && clearTimeout(mergeMaxWaitTimeout);
        clearInterval(checkInterval);
        callClientMergeLaunches(reporterOptions).then(() => resolve());
      }
    }, CHECK_IN_PROGRESS_INTERVAL);
    const maxTimeout = DEFAULT_MAX_LOCK_TIMEOUT;
    mergeMaxWaitTimeout = setTimeout(() => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      reject(new Error(`Merge launch error. Timeout of ${maxTimeout}ms exceeded.`));
    }, maxTimeout);
  });
};

module.exports = {
  getLaunchLockFileName,
  createMergeLaunchLockFile,
  deleteMergeLaunchLockFile,
  isLaunchesInProgress,
  callClientMergeLaunches,
  mergeLaunches,
};

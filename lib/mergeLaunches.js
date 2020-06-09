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

const fs = require('fs');
const glob = require('glob');
const RPClient = require('@reportportal/client-javascript');

const LAUNCH_LOCK_FILE_PREFIX = 'rplaunchinprogress';
const MAX_MERGE_TIMEOUT = 3600000; // 1 hour
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
  const beginMergeTime = Date.now();
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (!isLaunchesInProgress(reporterOptions.launch)) {
        clearInterval(checkInterval);
        callClientMergeLaunches(reporterOptions).then(() => resolve());
      } else if (Date.now() - beginMergeTime > MAX_MERGE_TIMEOUT) {
        clearInterval(checkInterval);
        reject(new Error(`Merge launch error. Timeout of ${MAX_MERGE_TIMEOUT}ms exceeded.`));
      }
    }, CHECK_IN_PROGRESS_INTERVAL);
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

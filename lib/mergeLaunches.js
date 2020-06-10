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

const MAX_MERGE_TIMEOUT = 3600000; // 1 hour
const CHECK_IN_PROGRESS_INTERVAL = 3000;

const mergeLaunchesUtils = require('./mergeLaunchesUtils');

const mergeLaunches = (reporterOptions) => {
  if (!mergeLaunchesUtils.isLaunchesInProgress(reporterOptions.launch)) {
    return mergeLaunchesUtils.callClientMergeLaunches(reporterOptions);
  }
  const beginMergeTime = Date.now();
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (!mergeLaunchesUtils.isLaunchesInProgress(reporterOptions.launch)) {
        clearInterval(checkInterval);
        mergeLaunchesUtils.callClientMergeLaunches(reporterOptions).then(() => resolve());
      } else if (Date.now() - beginMergeTime > MAX_MERGE_TIMEOUT) {
        clearInterval(checkInterval);
        reject(new Error(`Merge launch error. Timeout of ${MAX_MERGE_TIMEOUT}ms exceeded.`));
      }
    }, CHECK_IN_PROGRESS_INTERVAL);
  });
};

module.exports = {
  mergeLaunches,
};

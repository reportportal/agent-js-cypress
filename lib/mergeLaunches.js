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

const mergeParallelLaunches = async (client, config) => {
  const ciBuildId = process.env.CI_BUILD_ID;
  if (!ciBuildId) {
    console.error('For merge parallel launches CI_BUILD_ID must not be empty');
    return;
  }
  try {
    // 1. Send request to get all launches with the same CI_BUILD_ID attribute value
    const params = new URLSearchParams({
      'filter.has.attributeValue': ciBuildId,
    });
    const launchSearchUrl = `launch?${params.toString()}`;
    const response = await client.restClient.retrieveSyncAPI(launchSearchUrl, {
      headers: client.headers,
    });
    // 2. Filter them to find launches that are in progress
    const launchesInProgress = response.content.filter((launch) => launch.status === 'IN_PROGRESS');
    // 3. If exists, just return
    if (launchesInProgress.length) {
      return;
    }
    // 4. If not, merge all found launches with the same CI_BUILD_ID attribute value
    const launchIds = response.content.map((launch) => launch.id);
    const request = client.getMergeLaunchesRequest(launchIds);
    request.description = config.reporterOptions.description;
    request.extendSuitesDescription = false;
    const mergeURL = 'launch/merge';
    await client.restClient.create(mergeURL, request, { headers: client.headers });
  } catch (err) {
    console.error('Fail to merge launches', err);
  }
};

module.exports = {
  mergeLaunches,
  mergeParallelLaunches,
};

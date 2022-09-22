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

const testItemStatuses = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};
const logLevels = {
  ERROR: 'error',
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
};
const entityType = {
  SUITE: 'suite',
  STEP: 'step',
  BEFORE_METHOD: 'BEFORE_METHOD',
  BEFORE_SUITE: 'BEFORE_SUITE',
  AFTER_METHOD: 'AFTER_METHOD',
  AFTER_SUITE: 'AFTER_SUITE',
};

const hookTypes = {
  BEFORE_ALL: 'before all',
  BEFORE_EACH: 'before each',
  AFTER_ALL: 'after all',
  AFTER_EACH: 'after each',
};

const hookTypesMap = {
  [hookTypes.BEFORE_EACH]: entityType.BEFORE_METHOD,
  [hookTypes.BEFORE_ALL]: entityType.BEFORE_SUITE,
  [hookTypes.AFTER_EACH]: entityType.AFTER_METHOD,
  [hookTypes.AFTER_ALL]: entityType.AFTER_SUITE,
};

const reporterEvents = {
  INIT: 'rpInit',
  LOG: 'rpLog',
  LAUNCH_LOG: 'rpLaunchLog',
  ADD_ATTRIBUTES: 'rpAddAttrbiutes',
  SET_DESCRIPTION: 'rpSetDescription',
  SET_TEST_CASE_ID: 'setTestCaseId',
  CUSTOM_SCREENSHOT: 'customScreenshot',
  SET_STATUS: 'setStatus',
  SET_LAUNCH_STATUS: 'setLaunchStatus',
};

module.exports = {
  testItemStatuses,
  logLevels,
  entityType,
  hookTypesMap,
  reporterEvents,
};

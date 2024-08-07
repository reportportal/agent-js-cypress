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

const IPC_EVENTS = {
  LOG: 'log',
  LAUNCH_LOG: 'launchLog',
  ADD_ATTRIBUTES: 'addAttributes',
  SET_DESCRIPTION: 'setDescription',
  SET_TEST_CASE_ID: 'setTestCaseId',
  CONFIG: 'config',
  SCREENSHOT: 'screenshot',
  SET_STATUS: 'setStatus',
  SET_LAUNCH_STATUS: 'setLaunchStatus',
  CUCUMBER_STEP_START: 'cucumberStepStart',
  CUCUMBER_STEP_END: 'cucumberStepEnd',
};

module.exports = { IPC_EVENTS };

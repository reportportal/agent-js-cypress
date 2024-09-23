/*
 *  Copyright 2024 EPAM Systems
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

const path = require('path');
const clientHelpers = require('@reportportal/client-javascript/lib/helpers');

const pjson = require('../../package.json');
const { entityType, hookTypesMap, testItemStatuses } = require('../constants');
const { getCodeRef } = require('./common');

const { FAILED, PASSED, SKIPPED } = testItemStatuses;

const getAgentInfo = () => ({
  version: pjson.version,
  name: pjson.name,
});

const getSystemAttributes = (config) => {
  const agentInfo = getAgentInfo();
  const systemAttributes = [
    {
      key: 'agent',
      value: `${agentInfo.name}|${agentInfo.version}`,
      system: true,
    },
  ];
  if (config.reporterOptions.skippedIssue === false) {
    const skippedIssueAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };
    systemAttributes.push(skippedIssueAttribute);
  }
  return systemAttributes;
};

const getConfig = (initialConfig) => {
  const attributes = initialConfig.reporterOptions.attributes || [];

  if (
    initialConfig.reporterOptions.parallel &&
    initialConfig.reporterOptions.autoMerge &&
    process.env.CI_BUILD_ID
  ) {
    attributes.push({ value: process.env.CI_BUILD_ID });
  }

  const { apiKey, token, ...reporterOptions } = initialConfig.reporterOptions;

  let calculatedApiKey = process.env.RP_API_KEY || apiKey;
  if (!calculatedApiKey) {
    calculatedApiKey = process.env.RP_TOKEN || token;
    if (calculatedApiKey) {
      console.warn('ReportPortal warning. Option "token" is deprecated. Use "apiKey" instead.');
    }
  }

  return {
    ...initialConfig,
    reporterOptions: {
      ...reporterOptions,
      attributes,
      apiKey: calculatedApiKey,
    },
  };
};

const getLaunchStartObject = (config) => {
  const launchAttributes = (config.reporterOptions.attributes || []).concat(
    getSystemAttributes(config),
  );

  return {
    launch: config.reporterOptions.launch,
    description: config.reporterOptions.description,
    attributes: launchAttributes,
    rerun: config.reporterOptions.rerun,
    rerunOf: config.reporterOptions.rerunOf,
    mode: config.reporterOptions.mode,
    startTime: clientHelpers.now(),
    id: config.reporterOptions.launchId,
  };
};

const getSuiteStartInfo = (suite, testFileName) => ({
  id: suite.id,
  title: suite.title,
  startTime: clientHelpers.now(),
  description: suite.description,
  codeRef: getCodeRef(suite.titlePath(), testFileName),
  parentId: !suite.root ? suite.parent.id : undefined,
  testFileName: testFileName.split(path.sep).pop(),
});

const getSuiteEndInfo = (suite) => {
  let failed = false;
  if (suite.tests != null) {
    failed = suite.tests.some((test) => test.state === testItemStatuses.FAILED);
  }
  return {
    id: suite.id,
    status: failed ? testItemStatuses.FAILED : undefined,
    title: suite.title,
    endTime: clientHelpers.now(),
  };
};

const getSuiteStartObject = (suite) => ({
  type: entityType.SUITE,
  name: suite.title.slice(0, 255).toString(),
  startTime: suite.startTime,
  description: suite.description,
  codeRef: suite.codeRef,
  attributes: [],
});

const getSuiteEndObject = (suite) => ({
  status: suite.status,
  endTime: suite.endTime,
});

const getTestInfo = (test, testFileName, status, err) => ({
  id: test.id,
  status: status || (test.state === 'pending' ? testItemStatuses.SKIPPED : test.state),
  title: test.title,
  codeRef: getCodeRef(test.titlePath(), testFileName),
  parentId: test.parent.id,
  err: err || test.err,
  testFileName,
});

const getTestStartObject = (test) => ({
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  startTime: clientHelpers.now(),
  codeRef: test.codeRef,
  attributes: [],
});

const getTestEndObject = (testInfo, skippedIssue) => {
  const testEndObj = Object.assign(
    {
      endTime: clientHelpers.now(),
      status: testInfo.status,
      attributes: testInfo.attributes,
      description: testInfo.description,
    },
    testInfo.testCaseId && { testCaseId: testInfo.testCaseId },
  );
  if (testInfo.status === SKIPPED && skippedIssue === false) {
    testEndObj.issue = {
      issueType: 'NOT_ISSUE',
    };
  }
  return testEndObj;
};

const getHookInfo = (hook, testFileName, status, err) => {
  const hookRPType = hookTypesMap[hook.hookName];
  let parentId = hook.parent.id;
  if ([entityType.BEFORE_SUITE, entityType.AFTER_SUITE].includes(hookRPType)) {
    parentId = hook.parent.parent && hook.parent.parent.title ? hook.parent.parent.id : undefined;
  }
  return {
    id: hook.failedFromHookId ? `${hook.failedFromHookId}_${hook.id}` : `${hook.hookId}_${hook.id}`,
    hookName: hook.hookName,
    title: hook.title,
    status: status || (hook.state === FAILED ? FAILED : PASSED),
    parentId,
    codeRef: getCodeRef(hook.titlePath(), testFileName),
    err: (err && err.message) || err || (hook.err && hook.err.message),
    testFileName,
  };
};

const getHookStartObject = (hook) => {
  const hookRPType = hookTypesMap[hook.hookName];
  const hookName = hook.title.replace(`"${hook.hookName}" hook:`, '').trim();
  return {
    name: hookName,
    startTime: clientHelpers.now(),
    type: hookRPType,
    codeRef: hook.codeRef,
  };
};

module.exports = {
  getAgentInfo,
  getSystemAttributes,
  getConfig,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  // there are utils to preprocess Mocha entities
  getTestInfo,
  getSuiteStartInfo,
  getSuiteEndInfo,
  getHookInfo,
};

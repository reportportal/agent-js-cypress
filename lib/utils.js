/* eslint-disable no-underscore-dangle */
/*
 *  Copyright 2022 EPAM Systems
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
const path = require('path');
const minimatch = require('minimatch');
const { entityType, hookTypesMap, testItemStatuses } = require('./constants');
const pjson = require('./../package.json');

const { FAILED, PASSED, SKIPPED } = testItemStatuses;

const base64Encode = (file) => {
  const bitmap = fs.readFileSync(file);
  return Buffer.from(bitmap).toString('base64');
};

const getCustomScreenshots = (customScreenshotsFileNames, specFilePath) => {
  if (!customScreenshotsFileNames.length) return [];

  const specFileName = path.parse(specFilePath).base;
  return customScreenshotsFileNames.reduce((screenshots, screenshotFilename) => {
    const screenshotFiles = glob.sync(`**/${specFileName}/${screenshotFilename}.png`) || [];
    if (screenshotFiles.length) {
      return screenshots.concat([
        {
          name: screenshotFilename.split('/').pop(),
          type: 'image/png',
          content: base64Encode(screenshotFiles[0]),
        },
      ]);
    }
    return screenshots;
  }, []);
};

const getPassedScreenshots = (testTitle) => {
  const patternFirstScreenshot = `**/*${testTitle.replace(/[",',:]/g, '')}.png`;
  const patternNumeratedScreenshots = `**/*${testTitle.replace(/[",',:]/g, '')} (*([0-9])).png`;
  const firstScreenshot = glob.sync(patternFirstScreenshot) || [];
  const numeratedScreenshots = glob.sync(patternNumeratedScreenshots) || [];
  const files = firstScreenshot.concat(numeratedScreenshots);
  return (files || []).map((file, index) => ({
    name: `${testTitle}-${index + 1}`,
    type: 'image/png',
    content: base64Encode(file),
  }));
};

const getFailedScreenshot = (testTitle) => {
  const pattern = `**/*${testTitle.replace(/[",',:]/g, '')} (failed).png`;
  const files = glob.sync(pattern);
  return files.length
    ? {
        name: `${testTitle} (failed)`,
        type: 'image/png',
        content: base64Encode(files[0]),
      }
    : undefined;
};

const getCodeRef = (testItemPath, testFileName) =>
  `${testFileName.replace(/\\/g, '/')}/${testItemPath.join('/')}`;

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

  return {
    ...initialConfig,
    reporterOptions: {
      ...initialConfig.reporterOptions,
      attributes,
      token: process.env.RP_TOKEN || initialConfig.reporterOptions.token,
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
    startTime: new Date().valueOf(),
  };
};

const attributesForTags = (tags, options) => {
  if (!tags) return tags;
  if (options) {
    const addAttributes = options.addCypressGrepAttributes;
    if (addAttributes === false) return undefined;
  }
  if (typeof tags === 'string') {
    return tags.split(' ').map((tag) => ({ value: tag }));
  }
  if (Array.isArray(tags)) {
    return tags.map((tag) => ({ value: tag }));
  }
  return undefined;
};

const getSuiteStartObject = (suite, testFileName, reporterOptions) => {
  // eslint-disable-next-line no-underscore-dangle
  const tags = suite._testConfig && suite._testConfig.tags;
  return {
    id: suite.id,
    type: entityType.SUITE,
    name: suite.title.slice(0, 255).toString(),
    startTime: new Date().valueOf(),
    description: suite.description,
    attributes: attributesForTags(tags, reporterOptions) || [],
    codeRef: getCodeRef(suite.titlePath(), testFileName),
    parentId: !suite.root ? suite.parent.id : undefined,
  };
};

const getSuiteEndObject = (suite) => ({
  id: suite.id,
  title: suite.title,
  endTime: new Date().valueOf(),
});

const getTestInfo = (test, testFileName, status, err) => {
  // read cypress-grep tags from runnable.
  // if tags of test are inherited from it's parent ignore them
  let testTags;
  if (test._testConfig && test._testConfig.unverifiedTestConfig) {
    testTags = test._testConfig.unverifiedTestConfig.tags;
  }
  const parentTags = test.parent._testConfig && test.parent._testConfig.tags;
  if (testTags && parentTags === testTags) {
    testTags = undefined;
  }

  return {
    id: test.id,
    status: status || (test.state === 'pending' ? testItemStatuses.SKIPPED : test.state),
    title: test.title,
    codeRef: getCodeRef(test.titlePath(), testFileName),
    parentId: test.parent.id,
    err: (err && err.message) || err || (test.err && test.err.message),
    testFileName,
    tags: testTags,
  };
};

const getTestStartObject = (test, reporterOptions) => ({
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  codeRef: test.codeRef,
  attributes: attributesForTags(test.tags, reporterOptions) || [],
});

const getTestEndObject = (testInfo, skippedIssue) => {
  const testEndObj = Object.assign(
    {
      endTime: new Date().valueOf(),
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
    startTime: new Date().valueOf(),
    type: hookRPType,
    codeRef: hook.codeRef,
  };
};
const getFixtureFolderPattern = (config) => {
  return [].concat(config.fixturesFolder ? path.join(config.fixturesFolder, '**', '*') : []);
};

const getExcludeSpecPattern = (config) => {
  // Return cypress >= 10 pattern.
  if (config.excludeSpecPattern) {
    const excludePattern = Array.isArray(config.excludeSpecPattern)
      ? config.excludeSpecPattern
      : [config.excludeSpecPattern];
    return [...excludePattern];
  }

  // Return cypress <= 9 pattern
  const ignoreTestFilesPattern = Array.isArray(config.ignoreTestFiles)
    ? config.ignoreTestFiles
    : [config.ignoreTestFiles] || [];

  return [...ignoreTestFilesPattern];
};

const getSpecPattern = (config) => {
  if (config.specPattern) return [].concat(config.specPattern);

  return Array.isArray(config.testFiles)
    ? config.testFiles.map((file) => path.join(config.integrationFolder, file))
    : [].concat(path.join(config.integrationFolder, config.testFiles));
};

const getTotalSpecs = (config) => {
  if (!config.testFiles && !config.specPattern)
    throw new Error('Configuration property not set! Neither for cypress <= 9 nor cypress >= 10');

  const specPattern = getSpecPattern(config);

  const excludeSpecPattern = getExcludeSpecPattern(config);

  const options = {
    sort: true,
    absolute: true,
    nodir: true,
    ignore: [config.supportFile].concat(getFixtureFolderPattern(config)),
  };

  const doesNotMatchAllIgnoredPatterns = (file) =>
    excludeSpecPattern.every(
      (pattern) => !minimatch(file, pattern, { dot: true, matchBase: true }),
    );

  const globResult = specPattern.reduce(
    (files, pattern) => files.concat(glob.sync(pattern, options) || []),
    [],
  );

  return globResult.filter(doesNotMatchAllIgnoredPatterns).length;
};

module.exports = {
  getFailedScreenshot,
  getPassedScreenshots,
  getCustomScreenshots,
  getAgentInfo,
  getCodeRef,
  getSystemAttributes,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestStartObject,
  getTestInfo,
  getTestEndObject,
  getHookInfo,
  getHookStartObject,
  getTotalSpecs,
  getConfig,
  getExcludeSpecPattern,
  getFixtureFolderPattern,
  getSpecPattern,
};

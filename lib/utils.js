const fs = require('fs');
const glob = require('glob');
const { entityType, hookTypesMap, testItemStatuses } = require('./constants');
const pjson = require('./../package.json');

const { FAILED, PASSED, SKIPPED } = testItemStatuses;

const base64Encode = (file) => {
  const bitmap = fs.readFileSync(file);
  return Buffer.from(bitmap).toString('base64');
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

const getLaunchStartObject = (config) => {
  const launchesAttributes = (config.reporterOptions.attributes || []).concat(
    getSystemAttributes(config),
  );
  return {
    launch: config.reporterOptions.launch,
    description: config.reporterOptions.description,
    attributes: launchesAttributes,
    rerun: config.reporterOptions.rerun,
    rerunOf: config.reporterOptions.rerunOf,
    startTime: new Date().valueOf(),
  };
};

const getSuiteStartObject = (suite, testFileName) => ({
  id: suite.id,
  type: entityType.SUITE,
  name: suite.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  description: suite.description,
  attributes: [],
  codeRef: getCodeRef(suite.titlePath(), testFileName),
  parentId: !suite.root ? suite.parent.id : undefined,
});

const getSuiteEndObject = (suite) => ({
  id: suite.id,
  endTime: new Date().valueOf(),
});

const getTestInfo = (test, testFileName, status, err) => ({
  id: test.id,
  status: status || (test.state === 'pending' ? testItemStatuses.SKIPPED : test.state),
  title: test.title,
  codeRef: getCodeRef(test.titlePath(), testFileName),
  parentId: test.parent.id,
  err: (err && err.message) || err || (test.err && test.err.message),
});

const getTestStartObject = (test) => ({
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  codeRef: test.codeRef,
  attributes: [],
});

const getTestEndObject = (testInfo, skippedIssue) => {
  const testEndObj = {
    endTime: new Date().valueOf(),
    status: testInfo.status,
    attributes: testInfo.attributes,
    description: testInfo.description,
  };
  if (testInfo.status === SKIPPED && skippedIssue === false) {
    testEndObj.issue = {
      issueType: 'NOT_ISSUE',
    };
  }
  return testEndObj;
};

const getHookInfo = (hook, testFileName, status, err) => ({
  id: hook.failedFromHookId ? `${hook.failedFromHookId}_${hook.id}` : `${hook.hookId}_${hook.id}`,
  hookName: hook.hookName,
  title: hook.title,
  status: status || (hook.state === FAILED ? FAILED : PASSED),
  parentId: hook.parent && hook.parent.id,
  codeRef: getCodeRef(hook.titlePath(), testFileName),
  err: (err && err.message) || err || (hook.err && hook.err.message),
});

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

module.exports = {
  getFailedScreenshot,
  getPassedScreenshots,
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
};

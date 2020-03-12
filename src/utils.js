const fs = require('fs');
const glob = require('glob');
const { entityType, hookTypesMap, testItemStatuses } = require('./constants');

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

const getLaunchStartObject = (config) => {
  const launchesAttributes = config.reporterOptions.attributes || [];
  if (config.reporterOptions.skippedIssue === false) {
    const skippedIssueSysAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };
    launchesAttributes.push(skippedIssueSysAttribute);
  }
  return {
    launch: config.reporterOptions.launch,
    description: config.reporterOptions.description,
    attributes: launchesAttributes,
    rerun: config.reporterOptions.rerun,
    rerunOf: config.reporterOptions.rerunOf,
    startTime: new Date().valueOf(),
  };
};

const getSuiteStartObject = (suite) => ({
  id: suite.id,
  type: entityType.SUITE,
  name: suite.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  description: suite.description,
  attributes: [],
  parentId: !suite.root ? suite.parent.id : undefined,
});

const getSuiteEndObject = (suite) => ({
  id: suite.id,
  endTime: new Date().valueOf(),
});

const getTestInfo = (test, status, err) => ({
  id: test.id,
  status: status || (test.state === 'pending' ? testItemStatuses.SKIPPED : test.state),
  title: test.title,
  parentId: test.parent.id,
  err: (err && err.message) || err || (test.err && test.err.message),
});

const getTestStartObject = (test) => ({
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  attributes: [],
});

const getTestEndObject = (testInfo, skippedIssue) => {
  const testEndObj = {
    endTime: new Date().valueOf(),
    status: testInfo.status,
  };
  if (testInfo.status === SKIPPED && skippedIssue === false) {
    testEndObj.issue = {
      issueType: 'NOT_ISSUE',
    };
  }
  return testEndObj;
};

const getHookInfo = (hook, status, err) => ({
  id: hook.failedFromHookId ? `${hook.failedFromHookId}_${hook.id}` : `${hook.hookId}_${hook.id}`,
  hookName: hook.hookName,
  title: hook.title,
  status: status || (hook.state === FAILED ? FAILED : PASSED),
  parentId: hook.parent && hook.parent.id,
  err: (err && err.message) || err || (hook.err && hook.err.message),
});

const getHookStartObject = (hook) => {
  const hookRPType = hookTypesMap[hook.hookName];
  const hookName = hook.title.replace(`"${hook.hookName}" hook:`, '').trim();
  return {
    name: hookName,
    startTime: new Date().valueOf(),
    type: hookRPType,
  };
};

module.exports = {
  getFailedScreenshot,
  getPassedScreenshots,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestStartObject,
  getTestInfo,
  getTestEndObject,
  getHookInfo,
  getHookStartObject,
};

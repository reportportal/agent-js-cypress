const fs = require('fs');
const glob = require('glob');
const { entityType, hookTypesMap, testItemStatuses } = require('./constants');

const { FAILED, PASSED } = testItemStatuses;

const base64Encode = (file) => {
  const bitmap = fs.readFileSync(file);

  return Buffer.from(bitmap).toString('base64');
};

const getPassedScreenshots = (testTitle) => {
  const pattern = `**/*${testTitle.replace(/[",',:]/g, '')}.png`;
  const files = glob.sync(pattern);
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

const getLaunchStartObject = (config) => ({
  token: config.reporterOptions.token,
  name: config.reporterOptions.launch,
  description: config.reporterOptions.description,
  attributes: config.reporterOptions.attributes,
  rerun: config.reporterOptions.rerun,
  rerunOf: config.reporterOptions.rerunOf,
  startTime: new Date().valueOf(),
});

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

const getTestStartObject = (test) => ({
  id: test.id,
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  startTime: new Date().valueOf(),
  attributes: [],
  parentId: test.parent.id,
});

const getTestEndObject = (test, status, err) => ({
  id: test.id,
  type: entityType.STEP,
  name: test.title.slice(0, 255).toString(),
  attributes: [],
  endTime: new Date().valueOf(),
  status: status || test.state,
  title: test.title,
  error: err || (test.err && test.err.message),
  parentId: test.parent.id,
});

const getHookStartObject = (hook) => {
  const hookRPType = hookTypesMap[hook.hookName];
  const hookName = hook.title.replace(`"${hook.hookName}" hook:`, '').trim();
  return {
    id: `${hook.hookId}_${hook.id}`,
    name: hookName,
    startTime: new Date().valueOf(),
    type: hookRPType,
    parentId: hook.parent && hook.parent.id,
  };
};

const getHookEndObject = (hook, status, err) => {
  return {
    id: hook.failedFromHookId ? `${hook.failedFromHookId}_${hook.id}` : `${hook.hookId}_${hook.id}`,
    endTime: new Date().valueOf(),
    status: status || (hook.state === FAILED ? FAILED : PASSED),
    title: hook.title,
    error: err || (hook.err && hook.err.message),
  };
};

module.exports = {
  getFailedScreenshot,
  getPassedScreenshots,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestStartObject,
  getTestEndObject,
  getHookStartObject,
  getHookEndObject,
};

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

const DEFAULT_SPEC_CONFIG = {
  ignoreTestFiles: '*.hot-update.js',
  testFiles: '**/*.*',
  integrationFolder: 'cypress/integration',
  fixturesFolder: 'cypress/fixtures',
  supportFile: 'cypress/support',
};

module.exports = {
  testItemStatuses,
  logLevels,
  entityType,
  hookTypesMap,
  reporterEvents,
  DEFAULT_SPEC_CONFIG,
};

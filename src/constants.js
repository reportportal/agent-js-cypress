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
const entityType = { SUITE: 'suite', STEP: 'step' };

module.exports = { testItemStatuses, logLevels, entityType };

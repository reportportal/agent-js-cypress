const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'skipped' };
const logLevels = {
  ERROR: 'error',
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
};
const events = { RP_LOG: 'rp:log', RP_FILE: 'rp:file', RP_FAILED_LOG: 'rp:failedLog', RP_FAILED_FILE: 'rp:failedFile' };
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

module.exports = { testItemStatuses, logLevels, entityType, events };
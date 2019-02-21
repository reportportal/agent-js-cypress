const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'skipped' },
    logLevels = {
        ERROR: 'error',
        TRACE: 'trace',
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn'
    },
    events = { RP_LOG: 'rp:log', RP_FILE: 'rp:file', RP_FAILED_LOG: 'rp:failedLog', RP_FAILED_FILE: 'rp:failedFile' },
    entityType = { SUITE: 'SUITE', TEST: 'STEP' };

module.exports = { testItemStatuses, logLevels, entityType, events };

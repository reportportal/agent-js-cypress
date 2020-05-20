const { TEST_STATUSES } = require('./../testStatuses');

/**
 * Log commands
 */

Cypress.Commands.overwrite('log', (originalFn, ...args) => {
  const message = args.reduce((result, logItem) => {
    if (typeof logItem === 'object') {
      return [result, JSON.stringify(logItem)].join(' ');
    }
    return [result, logItem.toString()].join(' ');
  }, '');
  cy.task('logToRP', {
    level: 'trace',
    message,
  });
  originalFn(args);
});

Cypress.Commands.add('trace', (message, file) => {
  cy.task('logToRP', {
    level: 'trace',
    message,
    file,
  });
});

Cypress.Commands.add('debug', (message, file) => {
  cy.task('logToRP', {
    level: 'debug',
    message,
    file,
  });
});

Cypress.Commands.add('info', (message, file) => {
  cy.task('logToRP', {
    level: 'info',
    message,
    file,
  });
});

Cypress.Commands.add('warn', (message, file) => {
  cy.task('logToRP', {
    level: 'warn',
    message,
    file,
  });
});

Cypress.Commands.add('error', (message, file) => {
  cy.task('logToRP', {
    level: 'error',
    message,
    file,
  });
});

Cypress.Commands.add('fatal', (message, file) => {
  cy.task('logToRP', {
    level: 'fatal',
    message,
    file,
  });
});

Cypress.Commands.add('launchTrace', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'trace',
    message,
    file,
  });
});

Cypress.Commands.add('launchDebug', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'debug',
    message,
    file,
  });
});

Cypress.Commands.add('launchInfo', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'info',
    message,
    file,
  });
});

Cypress.Commands.add('launchWarn', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'warn',
    message,
    file,
  });
});

Cypress.Commands.add('launchError', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'error',
    message,
    file,
  });
});

Cypress.Commands.add('launchFatal', (message, file) => {
  cy.task('launchLogToRP', {
    level: 'fatal',
    message,
    file,
  });
});

/**
 * Attributes command
 */
Cypress.Commands.add('addTestAttributes', (attributes) => {
  cy.task('addTestAttributesToRPItem', {
    attributes,
  });
});

/**
 * Set test description command
 */
Cypress.Commands.add('setTestDescription', (description) => {
  cy.task('setTestDescriptionToRPItem', {
    description,
  });
});

/**
 * Set test case ID command
 */
Cypress.Commands.add('setTestCaseId', (testCaseId, suiteTitle) => {
  cy.task('setTestCaseIdToRPItem', {
    testCaseId,
    suiteTitle,
  });
});

/**
 * Set test status commands
 */
Cypress.Commands.add('setStatus', (status, suiteTitle) => {
  cy.task('rp_setStatus', {
    status,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusPassed', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.PASSED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusFailed', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.FAILED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusSkipped', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.SKIPPED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusStopped', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.STOPPED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusInterrupted', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.INTERRUPTED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusCancelled', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.CANCELLED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusInfo', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.INFO,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusWarn', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: TEST_STATUSES.WARN,
    suiteTitle,
  });
});

/**
 * Set launch status commands
 */
Cypress.Commands.add('setLaunchStatus', (status) => {
  cy.task('rp_setLaunchStatus', {
    status,
  });
});

Cypress.Commands.add('setLaunchStatusPassed', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.PASSED,
  });
});

Cypress.Commands.add('setLaunchStatusFailed', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.FAILED,
  });
});

Cypress.Commands.add('setLaunchStatusSkipped', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.SKIPPED,
  });
});

Cypress.Commands.add('setLaunchStatusStopped', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.STOPPED,
  });
});

Cypress.Commands.add('setLaunchStatusInterrupted', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.INTERRUPTED,
  });
});

Cypress.Commands.add('setLaunchStatusCancelled', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.CANCELLED,
  });
});

Cypress.Commands.add('setLaunchStatusInfo', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.INFO,
  });
});

Cypress.Commands.add('setLaunchStatusWarn', () => {
  cy.task('rp_setLaunchStatus', {
    status: TEST_STATUSES.WARN,
  });
});

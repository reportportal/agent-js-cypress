/*
 *  Copyright 2020 EPAM Systems
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

const { RP_STATUSES } = require('./../testStatuses');

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
  cy.task('rp_Log', {
    level: 'trace',
    message,
  });
  originalFn(...args);
});

Cypress.Commands.add('trace', (message, file) => {
  cy.task('rp_Log', {
    level: 'trace',
    message,
    file,
  });
});

Cypress.Commands.overwrite('debug', (message, file) => {
  cy.task('rp_Log', {
    level: 'debug',
    message,
    file,
  });
});

Cypress.Commands.add('info', (message, file) => {
  cy.task('rp_Log', {
    level: 'info',
    message,
    file,
  });
});

Cypress.Commands.add('warn', (message, file) => {
  cy.task('rp_Log', {
    level: 'warn',
    message,
    file,
  });
});

Cypress.Commands.add('error', (message, file) => {
  cy.task('rp_Log', {
    level: 'error',
    message,
    file,
  });
});

Cypress.Commands.add('fatal', (message, file) => {
  cy.task('rp_Log', {
    level: 'fatal',
    message,
    file,
  });
});

Cypress.Commands.add('launchTrace', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'trace',
    message,
    file,
  });
});

Cypress.Commands.add('launchDebug', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'debug',
    message,
    file,
  });
});

Cypress.Commands.add('launchInfo', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'info',
    message,
    file,
  });
});

Cypress.Commands.add('launchWarn', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'warn',
    message,
    file,
  });
});

Cypress.Commands.add('launchError', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'error',
    message,
    file,
  });
});

Cypress.Commands.add('launchFatal', (message, file) => {
  cy.task('rp_launchLog', {
    level: 'fatal',
    message,
    file,
  });
});

/**
 * Attributes command
 */
Cypress.Commands.add('addTestAttributes', (attributes) => {
  cy.task('rp_addTestAttributes', {
    attributes,
  });
});

/**
 * Set test description command
 */
Cypress.Commands.add('setTestDescription', (description) => {
  cy.task('rp_setTestDescription', {
    description,
  });
});

/**
 * Set test case ID command
 */
Cypress.Commands.add('setTestCaseId', (testCaseId, suiteTitle) => {
  cy.task('rp_setTestCaseId', {
    testCaseId,
    suiteTitle,
  });
});

/**
 * Screenshot command: processing custom filenames
 */
Cypress.Commands.overwrite('screenshot', (originalFn, subject, name, option) => {
  if (name) {
    cy.task('rp_screenshot', {
      fileName: name,
    });
  }
  originalFn(subject, name, option);
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
    status: RP_STATUSES.PASSED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusFailed', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.FAILED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusSkipped', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.SKIPPED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusStopped', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.STOPPED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusInterrupted', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.INTERRUPTED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusCancelled', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.CANCELLED,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusInfo', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.INFO,
    suiteTitle,
  });
});

Cypress.Commands.add('setStatusWarn', (suiteTitle) => {
  cy.task('rp_setStatus', {
    status: RP_STATUSES.WARN,
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
    status: RP_STATUSES.PASSED,
  });
});

Cypress.Commands.add('setLaunchStatusFailed', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.FAILED,
  });
});

Cypress.Commands.add('setLaunchStatusSkipped', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.SKIPPED,
  });
});

Cypress.Commands.add('setLaunchStatusStopped', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.STOPPED,
  });
});

Cypress.Commands.add('setLaunchStatusInterrupted', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.INTERRUPTED,
  });
});

Cypress.Commands.add('setLaunchStatusCancelled', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.CANCELLED,
  });
});

Cypress.Commands.add('setLaunchStatusInfo', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.INFO,
  });
});

Cypress.Commands.add('setLaunchStatusWarn', () => {
  cy.task('rp_setLaunchStatus', {
    status: RP_STATUSES.WARN,
  });
});

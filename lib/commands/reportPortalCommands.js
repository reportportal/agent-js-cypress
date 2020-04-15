Cypress.Commands.overwrite('log', (originalFn, ...args) => {
  const message = args.reduce((result, logItem) => {
    if (typeof logItem === 'object') {
      return [result, JSON.stringify(logItem)].join (' ');
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

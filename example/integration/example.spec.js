context('Example Cypress Test', () => {
  context('Check Cypress page', () => {
    beforeEach('Visit Cypress page', () => {
      return cy.visit('https://example.cypress.io', { timeout: 10000 });
    });
    context('Check content Cypress example page', () => {
      it('should contain Cypress', () => {
        cy.contains('Cypress');
      });

      it('should contain Commands', () => {
        cy.contains('Commands').screenshot();
      });

      it('should contain gfkjdgkjdfgl (failed)', () => {
        cy.contains('gfkjdgkjdfgl').screenshot();
      });
    });
    context('Check url Cypress example page', () => {
      it('should contain cypress', () => {
        cy.url().should('include', 'cypress');
      });
      it('should contain example', () => {
        cy.url().should('include', 'example');
      });
      it('skipped test');
    });
    context('logs example: Check content Cypress example page', () => {
      it('report logs', () => {
        cy.log('cypress log message');
        cy.trace('trace message');
        cy.debug('debug message');
        cy.info('info message');
        cy.warn('warning message');
        cy.error('error message');
        cy.fatal('fatal message');
        cy.launchTrace('trace launch log');
        cy.launchDebug('debug launch log');
        cy.launchInfo('info launch log');
        cy.launchWarn('warn launch log');
        cy.launchError('error launch log');
        cy.launchFatal('fatal launch log');
        cy.fixture('test.png').then((file) => {
          cy.info('info log with attachment', {
            name: 'test.png',
            type: 'image/png',
            content: file,
          });
        });
      });
    });
  });
  context('Check content of Google', () => {
    beforeEach('Visit Google page', () => {
      return cy.visit('https://www.google.com/');
    });
    it('url should contain google', () => {
      cy.url().should('include', 'google');
    });
    it('check contain of google page (failed)', () => {
      cy.get('#hplogo').screenshot();
      cy.contains('example').screenshot();
    });
  });
});

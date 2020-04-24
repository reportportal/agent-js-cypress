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

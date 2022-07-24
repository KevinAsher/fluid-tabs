/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    // cy.viewport('samsung-s10')
    cy.viewport('ipad-2')
    cy.visit('http://localhost:3000')
    // cy.visitMobile('http://localhost:3000')
  })

  it('page switch', () => {
    let indexes = [0, 1, 2];
    cy.wait(300);

    indexes.forEach((val) => {
      cy.get("#scrollable-container > div").eq(val).realSwipeEnhanced([
        {direction: "toLeft", options: {distance: 300, x: 1, y: 100}}
      ]);
      cy.wait(1000);
    })

    indexes.map(i => i+1).reverse().forEach((val) => {
      cy.get("#scrollable-container > div").eq(val).realSwipeEnhanced([
        {direction: "toRight", options: {distance: 300, x: 1, y: 100}}
      ]);
      cy.wait(1000);
    })

    cy.get("#scrollable-container > div").eq(0).realSwipeEnhanced([
      {direction: "toLeft", options: {distance: 150, step: 5, x: 1, y: 100}},
      {direction: "toRight", options: {distance: 2, step: 1}}
    ]);

    cy.wait(300);
    cy.get("button").eq(1).realClick();
    cy.wait(500);
    
    cy.get("#scrollable-container > div").eq(1).realSwipeEnhanced([
      {direction: "toLeft", options: {distance: 150, step: 5, x: 1, y: 100}},
      {direction: "toRight", options: {distance: 2, step: 1}}
    ]);

    cy.wait(300);

    cy.get("#scrollable-container > div").eq(1).realSwipeEnhanced([
      {direction: "toRight", options: {distance: 150, step: 5, x: 1, y: 100}},
      {direction: "toLeft", options: {distance: 2, step: 1}}
    ]);
    
  })

})

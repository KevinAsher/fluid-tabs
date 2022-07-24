/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import { realSwipeEnhanced } from './realSwipeEnhanced';

type NormalizeCypressCommand<TFun> = TFun extends (
  subject: infer TSubject,
  ...args: infer TArgs
) => Promise<infer TReturn>
  ? (...args: TArgs) => Cypress.Chainable<TReturn>
  : TFun;

type NormalizeNonSubjectCypressCommand<TFun> = TFun extends (
  ...args: infer TArgs
) => Promise<infer TReturn>
  ? (...args: TArgs) => Cypress.Chainable<TReturn>
  : TFun;

Cypress.Commands.add(
  "realSwipeEnhanced",
  { prevSubject: true },
  realSwipeEnhanced as unknown as NormalizeCypressCommand<typeof realSwipeEnhanced>
);

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Fires native touch swipe event. Actually fires sequence of native events: touchStart -> touchMove[] -> touchEnd
       * Forked from cypress-real-events to add support to multi direction swiping, see the original repo here:
       * @see https://github.com/dmtrKovalenko/cypress-real-events#cyrealhover
       */
      realSwipeEnhanced: NormalizeCypressCommand<
        typeof import("./realSwipeEnhanced").realSwipeEnhanced
      >;
    }
  }
}

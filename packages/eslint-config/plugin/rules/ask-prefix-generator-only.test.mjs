import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './ask-prefix-generator-only.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('ask-prefix-generator-only', rule, {
  valid: [
    // Stories: generators may carry the prefix
    'function* askDateNow() { return yield { type: "Date::Now" }; }',
    'async function* askStream() { yield 1; }',
    'const logic = { *askLogin(u, p) { return yield* askAuth(u, p); } };',
    'class AuthLogic { *askLogin(u, p) { return yield* askAuth(u, p); } }',
    'export const askFoo = function* () { return yield* askBar(); };',

    // Aliases and factory results are not function literals
    'const askLog = askLogTemplateLiteral;',
    'export const askStorageScopeRead = createContextReader(storageScopeContext);',
    'const askChatSendRequest = createServiceRequester("eventDocAi", "ChatSend");',

    // Non-ask names are untouched
    'function normalThing() {}',
    'const handler = () => {};',
    'const asker = () => {};',
    'const askew = () => {};',
    'const ask = () => {};',

    // Computed keys cannot be checked by name
    'const logic = { [askKey]: () => {} };',
  ],

  invalid: [
    {
      code: 'function askDateNow() { return new Date(); }',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'async function askFetch() { return fetch(url); }',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'const askThing = () => {};',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'const askThing = function () {};',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'const x = function askThing() {};',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'const logic = { askLogin(u, p) { return auth(u, p); } };',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'const logic = { askLogin: (u, p) => auth(u, p) };',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'class AuthLogic { askLogin(u, p) { return auth(u, p); } }',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'class AuthLogic { askLogin = () => {}; }',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'obj.askThing = () => {};',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
    {
      code: 'askThing = async () => {};',
      errors: [{ messageId: 'askPrefixNonGenerator' }],
    },
  ],
});

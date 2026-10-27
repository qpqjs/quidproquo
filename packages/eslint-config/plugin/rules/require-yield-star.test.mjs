import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './require-yield-star.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('require-yield-star', rule, {
  valid: [
    // The canonical form
    'function* story() { const now = yield* askDateNow(); }',
    'function* story() { yield* askFileWrite("drive", "file.txt"); }',
    'function* story() { return yield* askDateNow(); }',

    // Member-call stories
    'function* story() { const auth = yield* authLogic.askLogin(u, p); }',

    // Composition: ask calls as arguments build generators for the outer ask
    'function* story() { yield* askRunParallel([askRandomNumber(), askDateNow()]); }',
    'function* story() { const r = yield* askCatch(askRunParallel([askA()])); }',
    'function* story() { yield* askFoo({ inner: askBar() }); }',
    'function* story() { yield* askBatch(items.map(mapper)); }',

    // Outside a generator you cannot yield; these are the legitimate
    // create-and-hand-off patterns (tests, forwarding wrappers).
    'const requester = askDateNow();',
    'function bind(deps) { return askFunction(deps); }',
    'it("drives manually", () => { const r = askKeyValueStoreGet("users"); r.next(); });',
    'runStory(askDateNow(), mocks);',

    // Callback inside a generator is its own non-generator scope
    'function* story() { const gens = items.map((i) => askProcess(i)); yield* askRunParallel(gens); }',

    // Non-ask calls are untouched
    'function* story() { doThing(); const x = compute(); }',

    // Lowercase continuation is not the ask prefix
    'function* story() { const x = askew(); }',

    // Tagged-template stories delegated correctly
    'function* story() { yield* askLog`hello ${name}`; }',
    'function* story() { return yield* askLog`hello ${name}`; }',

    // Tagged template outside a generator is create-and-hand-off
    'runStory(askLog`hello`, mocks);',

    // Non-ask tags are untouched
    'function* story() { const s = gql`query { me }`; }',
  ],

  invalid: [
    {
      code: 'function* story() { const thing = askDateNow(); }',
      output: 'function* story() { const thing = yield* askDateNow(); }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { const thing = yield askDateNow(); }',
      output: 'function* story() { const thing = yield* askDateNow(); }',
      errors: [{ messageId: 'missingStar' }],
    },
    {
      code: 'function* story() { askDateNow(); }',
      output: 'function* story() { yield* askDateNow(); }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'async function* story() { const t = await askDateNow(); }',
      output: 'async function* story() { const t = yield* askDateNow(); }',
      errors: [{ messageId: 'awaitedAsk' }],
    },
    {
      code: 'function* story() { authLogic.askLogin(u, p); }',
      output: 'function* story() { yield* authLogic.askLogin(u, p); }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { return askDateNow(); }',
      output: 'function* story() { return yield* askDateNow(); }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    // Positions that reject a bare yield expression get parenthesised
    {
      code: 'function* story() { if (!askUserExists(id)) { fail(); } }',
      output: 'function* story() { if (!(yield* askUserExists(id))) { fail(); } }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { const n = askDateNow().length; }',
      output: 'function* story() { const n = (yield* askDateNow()).length; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { const total = askCount() + 1; }',
      output: 'function* story() { const total = (yield* askCount()) + 1; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    // Ternary branches are assignment positions, no parens needed
    {
      code: 'function* story() { const x = flag ? askA() : yield* askB(); }',
      output: 'function* story() { const x = flag ? yield* askA() : yield* askB(); }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    // Array literal not being passed anywhere is still un-run generators
    {
      code: 'function* story() { const gens = [askA()]; }',
      output: 'function* story() { const gens = [yield* askA()]; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    // Nested generator enforces against itself
    {
      code: 'function outer() { function* inner() { askDateNow(); } }',
      output: 'function outer() { function* inner() { yield* askDateNow(); } }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    // Both problems in one statement fix independently
    {
      code: 'function* story() { const a = askA(); const b = yield askB(); }',
      output: 'function* story() { const a = yield* askA(); const b = yield* askB(); }',
      errors: [{ messageId: 'missingYieldStar' }, { messageId: 'missingStar' }],
    },
    // Tagged-template stories need yield* too
    {
      code: 'function* story() { askLog`hello ${name}`; }',
      output: 'function* story() { yield* askLog`hello ${name}`; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { return askLog`hello ${name}`; }',
      output: 'function* story() { return yield* askLog`hello ${name}`; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
    {
      code: 'function* story() { yield askLog`hello`; }',
      output: 'function* story() { yield* askLog`hello`; }',
      errors: [{ messageId: 'missingStar' }],
    },
    {
      code: 'async function* story() { await askLog`hello`; }',
      output: 'async function* story() { yield* askLog`hello`; }',
      errors: [{ messageId: 'awaitedAsk' }],
    },
    {
      code: 'function* story() { logger.askLog`hello`; }',
      output: 'function* story() { yield* logger.askLog`hello`; }',
      errors: [{ messageId: 'missingYieldStar' }],
    },
  ],
});

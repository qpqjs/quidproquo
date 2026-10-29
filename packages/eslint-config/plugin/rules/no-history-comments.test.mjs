import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './no-history-comments.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-history-comments', rule, {
  valid: [
    '// The batch is a transaction: a losing writer gets Conflict with nothing landed.',
    '/** Reads the active tenant scope, or null outside a tenant-aware request. */',
    '// A value used to derive the key (the passive sense is not history)',
  ],
  invalid: [
    { code: '// Resolve the host — the apex has no subdomain', errors: [{ messageId: 'emDash' }] },
    { code: '// This used to be four implementations', errors: [{ messageId: 'history' }] },
    { code: '/* no longer reads the json files */', errors: [{ messageId: 'history' }] },
  ],
});

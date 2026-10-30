import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './filename-matches-export.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: 'module' } });

ruleTester.run('filename-matches-export', rule, {
  valid: [
    { code: 'export const askTenantRead = 1;', filename: 'askTenantRead.ts' },
    { code: 'export const askTenantReadBase = 1; export const askTenantRead = 2;', filename: 'askTenantRead.ts' },
    { code: 'export const MAX_ITEMS = 3000;', filename: 'maxItems.ts' },
    { code: 'export const a = 1; export const b = 2;', filename: 'anything.ts' },
    { code: 'export default 1;', filename: 'anything.ts' },
    { code: 'export const a = 1;', filename: 'index.ts' },
  ],
  invalid: [
    { code: 'export const askTenantRead = 1;', filename: 'tenantRead.ts', errors: [{ messageId: 'mismatch' }] },
    { code: 'export const MAX_ITEMS = 3000;', filename: 'MAX_ITEMS.ts', errors: [{ messageId: 'mismatch' }] },
  ],
});

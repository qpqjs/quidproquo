import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './one-export-per-file.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: 'module' } });

ruleTester.run('one-export-per-file', rule, {
  valid: [
    { code: 'export const askTenantRead = 1;', filename: 'askTenantRead.ts' },
    { code: 'export const askTenantReadBase = 1; export const askTenantRead = 2;', filename: 'askTenantRead.ts' },
    { code: 'export const TenantSetLoadingPayload = 1; export const TenantSetLoadingEffect = 2;', filename: 'TenantSetLoadingEffect.ts' },
    { code: 'export const a = 1; export const b = 2;', filename: 'index.ts' },
    { code: 'export const a = 1; export const b = 2;', filename: 'thing.test.ts' },
  ],
  invalid: [
    { code: 'export const a = 1; export const b = 2;', filename: 'a.ts', errors: [{ messageId: 'tooMany' }] },
    { code: 'export const askA = 1; export const askB = 2; export const askC = 3;', filename: 'askA.ts', errors: [{ messageId: 'tooMany' }] },
  ],
});

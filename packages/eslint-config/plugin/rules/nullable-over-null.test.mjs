import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import tsParser from '@typescript-eslint/parser';

import rule from './nullable-over-null.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('nullable-over-null', rule, {
  valid: ['type A = Nullable<string>;', 'type B = string | number | null;', 'let x: string | undefined;'],
  invalid: [
    { code: 'type A = string | null;', errors: [{ messageId: 'nullable' }] },
    { code: 'let x: number | null = null;', errors: [{ messageId: 'nullable' }] },
  ],
});

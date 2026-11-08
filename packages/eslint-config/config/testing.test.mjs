import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { testingConfigs } from './testing.mjs';

// Lints text as if it lived at `filePath` (relative, so it sits inside ESLint's base path and is not ignored).
const filenameMessagesFor = async (filePath) => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{ files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } }, ...testingConfigs],
  });
  const [result] = await eslint.lintText('export {};', { filePath });

  return result.messages.filter((message) => message.ruleId === 'vitest/consistent-test-filename');
};

// T1: test files are `<subject>.test.ts(x)`, never `.spec`. The block has to lint `.spec` files for the rule to say so.
describe('testingConfigs', () => {
  it('reports a .spec test file name', async () => {
    const messages = await filenameMessagesFor('virtual/src/thing.spec.ts');

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toMatch(/test file name pattern/);
  });

  it('accepts a .test file name', async () => {
    expect(await filenameMessagesFor('virtual/src/thing.test.ts')).toHaveLength(0);
  });
});

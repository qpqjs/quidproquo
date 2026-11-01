import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { restrictedSyntaxConfigs } from './restrictedSyntax.mjs';

// Lints text as if it lived at `filePath` (relative, so it sits inside ESLint's base path and is not ignored), so each
// block's files and ignores take part the way they do in a repo.
const messagesFor = async (code, filePath) => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{ files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } }, ...restrictedSyntaxConfigs],
  });
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages.map((message) => message.message);
};

const reExport = "export * from './other';";
const physicalName = 'const name = `${applicationName}-${environment}`;';

// Flat config replaces no-restricted-syntax's options block by block, so the G6 re-export selectors must survive the
// later per-kind blocks (D6 for .ts, hooks for .tsx) or `export * from` goes unreported in ordinary source files.
describe('restrictedSyntaxConfigs', () => {
  it('reports a re-export in an ordinary .ts source file alongside the D6 check', async () => {
    const messages = await messagesFor(`${reExport}\n${physicalName}`, 'virtual/src/thing.ts');

    expect(messages.some((message) => message.startsWith('G6'))).toBe(true);
    expect(messages.some((message) => message.startsWith('D6'))).toBe(true);
  });

  it('reports a re-export in an ordinary .tsx file alongside the hooks check', async () => {
    const messages = await messagesFor(`${reExport}\nexport const useThing = () => 1;`, 'virtual/src/Thing.tsx');

    expect(messages.some((message) => message.startsWith('G6'))).toBe(true);
    expect(messages.some((message) => message.startsWith('E:'))).toBe(true);
  });

  it('still allows re-exports in barrels while keeping the D6 and hooks checks there', async () => {
    const tsMessages = await messagesFor(`${reExport}\n${physicalName}`, 'virtual/src/index.ts');
    const tsxMessages = await messagesFor(`${reExport}\nexport const useThing = () => 1;`, 'virtual/src/index.tsx');

    expect(tsMessages.some((message) => message.startsWith('G6'))).toBe(false);
    expect(tsMessages.some((message) => message.startsWith('D6'))).toBe(true);
    expect(tsxMessages.some((message) => message.startsWith('G6'))).toBe(false);
    expect(tsxMessages.some((message) => message.startsWith('E:'))).toBe(true);
  });

  it('keeps re-exports reported in test files, which D6 skips', async () => {
    const messages = await messagesFor(`${reExport}\n${physicalName}`, 'virtual/src/thing.test.ts');

    expect(messages.some((message) => message.startsWith('G6'))).toBe(true);
    expect(messages.some((message) => message.startsWith('D6'))).toBe(false);
  });
});

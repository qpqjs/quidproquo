import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getCryptoActionProcessor } from './getCryptoActionProcessor';
import { getCryptoDecryptActionProcessor } from './getCryptoDecryptActionProcessor';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getCryptoActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getCryptoEncryptActionProcessor(qpqConfig, dynamicModuleLoader),
      getCryptoDecryptActionProcessor(qpqConfig, dynamicModuleLoader),
      getCryptoSignActionProcessor(qpqConfig, dynamicModuleLoader),
      getCryptoVerifyActionProcessor(qpqConfig, dynamicModuleLoader),
      getCryptoGetPublicKeyActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getCryptoActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});

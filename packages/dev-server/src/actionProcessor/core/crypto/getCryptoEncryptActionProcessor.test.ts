import { askCryptoEncrypt, CryptoActionType, defineCryptoKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';

describe('getCryptoEncryptActionProcessor', () => {
  let runtimePath: string;

  beforeEach(async () => {
    runtimePath = await mkdtemp(join(tmpdir(), 'qpq-crypto-'));
  });

  afterEach(async () => {
    await rm(runtimePath, { recursive: true, force: true });
  });

  const resolve = async (processorFactory: (config: any) => any, member: CryptoActionType, settings: any[]) => {
    const processors = await processorFactory(buildTestDevServerConfig({ runtimePath }))(buildTestQpqConfig(settings), noopDynamicModuleLoader);
    return processors[member];
  };

  it('encrypts with the seeded local master key; the ciphertext is an opaque blob, not the plaintext', async () => {
    const encrypt = await resolve(getCryptoEncryptActionProcessor, CryptoActionType.Encrypt, [defineCryptoKey('my-key')]);

    const [ciphertext, error] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'hello', context: { tenant: 't1' } });

    expect(error).toBeUndefined();
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext).not.toContain('hello');
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const encrypt = await resolve(getCryptoEncryptActionProcessor, CryptoActionType.Encrypt, []);

    const [, error] = await invokeProcessor(encrypt, { keyName: 'nope', plaintext: 'hello' });

    expect(error?.errorType).toBe(askCryptoEncrypt.errorType.KeyNotConfigured);
  });
});

import { askCryptoDecrypt, CryptoActionType, defineCryptoKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getCryptoDecryptActionProcessor } from './getCryptoDecryptActionProcessor';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';

describe('getCryptoDecryptActionProcessor', () => {
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

  it('round-trips what the encrypt processor produced under the same context', async () => {
    const settings = [defineCryptoKey('my-key')];
    const encrypt = await resolve(getCryptoEncryptActionProcessor, CryptoActionType.Encrypt, settings);
    const decrypt = await resolve(getCryptoDecryptActionProcessor, CryptoActionType.Decrypt, settings);
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'hello', context: { tenant: 't1' } });

    const [plaintext, error] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext, context: { tenant: 't1' } });

    expect(error).toBeUndefined();
    expect(plaintext).toBe('hello');
  });

  // Security regression: a ciphertext bound to one context must not open under another, locally as deployed.
  it('fails with ContextMismatch when the context differs', async () => {
    const settings = [defineCryptoKey('my-key')];
    const encrypt = await resolve(getCryptoEncryptActionProcessor, CryptoActionType.Encrypt, settings);
    const decrypt = await resolve(getCryptoDecryptActionProcessor, CryptoActionType.Decrypt, settings);
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'hello', context: { tenant: 't1' } });

    const [, error] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext, context: { tenant: 't2' } });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.ContextMismatch);
  });

  it('fails with MalformedCiphertext for a non-blob input', async () => {
    const decrypt = await resolve(getCryptoDecryptActionProcessor, CryptoActionType.Decrypt, [defineCryptoKey('my-key')]);

    const [, error] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext: 'not-a-blob' });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.MalformedCiphertext);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const decrypt = await resolve(getCryptoDecryptActionProcessor, CryptoActionType.Decrypt, []);

    const [, error] = await invokeProcessor(decrypt, { keyName: 'nope', ciphertext: 'x' });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.KeyNotConfigured);
  });
});

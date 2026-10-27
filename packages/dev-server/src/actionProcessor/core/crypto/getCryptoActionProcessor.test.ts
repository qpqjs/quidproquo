import { CRYPTO_BLOB_PREFIX_V1 } from 'quidproquo-actionprocessor-node';
import { ActionProcessor, askCryptoDecrypt, askCryptoEncrypt, buildTestQpqConfig, CryptoActionType, defineCryptoKey } from 'quidproquo-core';

import { existsSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getCryptoActionProcessor } from './getCryptoActionProcessor';

describe('getCryptoActionProcessor (dev server)', () => {
  let runtimePath: string;
  let encrypt: ActionProcessor<any>;
  let decrypt: ActionProcessor<any>;

  beforeEach(async () => {
    runtimePath = await mkdtemp(join(tmpdir(), 'qpq-crypto-test-'));

    const qpqConfig = buildTestQpqConfig([defineCryptoKey('my-key')]);
    const processors = await getCryptoActionProcessor({ runtimePath } as any)(qpqConfig, (() => null) as any);

    encrypt = processors[CryptoActionType.Encrypt];
    decrypt = processors[CryptoActionType.Decrypt];
  });

  afterEach(async () => {
    await rm(runtimePath, { recursive: true, force: true });
  });

  it('round-trips offline and seeds the master key store', async () => {
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'shhh', context: { tenantId: 'tenant-a' } });

    expect(ciphertext.startsWith(CRYPTO_BLOB_PREFIX_V1)).toBe(true);
    expect(ciphertext).not.toContain('shhh');
    expect(existsSync(join(runtimePath, 'cryptoKeys', 'test-module.json'))).toBe(true);

    const [plaintext] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext, context: { tenantId: 'tenant-a' } });
    expect(plaintext).toBe('shhh');
  });

  it('treats omitted context and {} as the same context', async () => {
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'shhh' });

    const [plaintext] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext, context: {} });
    expect(plaintext).toBe('shhh');
  });

  it('fails with ContextMismatch when the context differs, exactly as prod does', async () => {
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'shhh', context: { tenantId: 'tenant-a' } });

    const [, error] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext, context: { tenantId: 'tenant-b' } });
    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.ContextMismatch);
  });

  it('fails with MalformedCiphertext for a non-blob input', async () => {
    const [, error] = await invokeProcessor(decrypt, { keyName: 'my-key', ciphertext: 'not-a-blob' });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.MalformedCiphertext);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const [, encryptError] = await invokeProcessor(encrypt, { keyName: 'unknown-key', plaintext: 'shhh' });
    expect(encryptError?.errorType).toBe(askCryptoEncrypt.errorType.KeyNotConfigured);

    const [, decryptError] = await invokeProcessor(decrypt, { keyName: 'unknown-key', ciphertext: 'anything' });
    expect(decryptError?.errorType).toBe(askCryptoDecrypt.errorType.KeyNotConfigured);
  });

  it('decrypts values encrypted in an earlier processor instance (key persisted on disk)', async () => {
    const [ciphertext] = await invokeProcessor(encrypt, { keyName: 'my-key', plaintext: 'shhh' });

    const qpqConfig = buildTestQpqConfig([defineCryptoKey('my-key')]);
    const rebuilt = await getCryptoActionProcessor({ runtimePath } as any)(qpqConfig, (() => null) as any);

    const [plaintext] = await invokeProcessor(rebuilt[CryptoActionType.Decrypt], { keyName: 'my-key', ciphertext });
    expect(plaintext).toBe('shhh');
  });
});

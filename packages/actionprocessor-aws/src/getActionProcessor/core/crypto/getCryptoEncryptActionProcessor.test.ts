import { CRYPTO_BLOB_PREFIX_V1 } from 'quidproquo-actionprocessor-node';
import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askCryptoEncrypt, buildTestQpqConfig, CryptoActionType, defineCryptoKey } from 'quidproquo-core';

import { randomBytes } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedGeneratedDataKey } from '../../../logic/kms/getCachedGeneratedDataKey';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';

vi.mock('../../../logic/kms/getCachedGeneratedDataKey', () => ({
  getCachedGeneratedDataKey: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineCryptoKey('my-key')]);

const resolveProcessor = async () => {
  const processors = await getCryptoEncryptActionProcessor(buildConfig(), {} as any);
  return processors[CryptoActionType.Encrypt];
};

describe('getCryptoEncryptActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getCachedGeneratedDataKey).mockReset();
  });

  it('resolves the key alias, envelope encrypts, and returns a versioned blob', async () => {
    vi.mocked(getCachedGeneratedDataKey).mockResolvedValue({
      plaintextKey: randomBytes(32),
      wrappedKey: Buffer.from('wrapped-key-bytes'),
    });
    const processor = await resolveProcessor();

    const [ciphertext, error] = await invokeProcessor(processor, { keyName: 'my-key', plaintext: 'shhh', context: { tenantId: 'tenant-a' } });

    expect(error).toBeUndefined();
    expect(ciphertext!.startsWith(CRYPTO_BLOB_PREFIX_V1)).toBe(true);
    expect(ciphertext).not.toContain('shhh');
    expect(getCachedGeneratedDataKey).toHaveBeenCalledWith('alias/my-key-test-app-test-module-development', { tenantId: 'tenant-a' }, 'eu-west-1');
  });

  it('returns KeyNotConfigured without touching KMS when the key is not in config', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'unknown-key', plaintext: 'shhh' });

    expect(error?.errorType).toBe(askCryptoEncrypt.errorType.KeyNotConfigured);
    expect(getCachedGeneratedDataKey).not.toHaveBeenCalled();
  });

  it.each([
    ['NotFoundException', askCryptoEncrypt.errorType.KeyUnavailable],
    ['DisabledException', askCryptoEncrypt.errorType.KeyUnavailable],
    ['KMSInvalidStateException', askCryptoEncrypt.errorType.KeyUnavailable],
    ['AccessDeniedException', askCryptoEncrypt.errorType.KeyUnavailable],
    ['ThrottlingException', askCryptoEncrypt.errorType.Throttling],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(getCachedGeneratedDataKey).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'my-key', plaintext: 'shhh' });

    expect(error?.errorType).toBe(expectedType);
  });
});

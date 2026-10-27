import { envelopeEncrypt } from 'quidproquo-actionprocessor-node';
import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askCryptoDecrypt, buildTestQpqConfig, CryptoActionType, defineCryptoKey } from 'quidproquo-core';

import { randomBytes } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedUnwrappedDataKey } from '../../../logic/kms/getCachedUnwrappedDataKey';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getCryptoDecryptActionProcessor } from './getCryptoDecryptActionProcessor';

vi.mock('../../../logic/kms/getCachedUnwrappedDataKey', () => ({
  getCachedUnwrappedDataKey: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineCryptoKey('my-key')]);

const resolveProcessor = async () => {
  const processors = await getCryptoDecryptActionProcessor(buildConfig(), {} as any);
  return processors[CryptoActionType.Decrypt];
};

// Builds a real v1 blob with a known data key, so the processor can decrypt it
// once the mocked unwrap returns that key
const buildCiphertext = async (plaintext: string, context: Record<string, string> | undefined, dataKey: Buffer) => {
  return envelopeEncrypt(plaintext, context, {
    generateDataKey: async () => ({ plaintextKey: dataKey, wrappedKey: Buffer.from('wrapped-key-bytes') }),
    unwrapDataKey: async () => dataKey,
  });
};

describe('getCryptoDecryptActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getCachedUnwrappedDataKey).mockReset();
  });

  it('unwraps the data key and returns the plaintext', async () => {
    const dataKey = randomBytes(32);
    const ciphertext = await buildCiphertext('shhh', { tenantId: 'tenant-a' }, dataKey);
    vi.mocked(getCachedUnwrappedDataKey).mockResolvedValue(dataKey);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyName: 'my-key', ciphertext, context: { tenantId: 'tenant-a' } });

    expect(result).toEqual(['shhh']);
    expect(getCachedUnwrappedDataKey).toHaveBeenCalledWith(Buffer.from('wrapped-key-bytes'), { tenantId: 'tenant-a' }, 'eu-west-1');
  });

  it('returns ContextMismatch without touching KMS when the context differs', async () => {
    const ciphertext = await buildCiphertext('shhh', { tenantId: 'tenant-a' }, randomBytes(32));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'my-key', ciphertext, context: { tenantId: 'tenant-b' } });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.ContextMismatch);
    expect(getCachedUnwrappedDataKey).not.toHaveBeenCalled();
  });

  it('returns MalformedCiphertext for a non-blob input', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'my-key', ciphertext: 'not-a-blob' });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.MalformedCiphertext);
    expect(getCachedUnwrappedDataKey).not.toHaveBeenCalled();
  });

  it('returns KeyNotConfigured when the key is not in config', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'unknown-key', ciphertext: 'anything' });

    expect(error?.errorType).toBe(askCryptoDecrypt.errorType.KeyNotConfigured);
  });

  it.each([
    ['InvalidCiphertextException', askCryptoDecrypt.errorType.MalformedCiphertext],
    ['IncorrectKeyException', askCryptoDecrypt.errorType.MalformedCiphertext],
    ['NotFoundException', askCryptoDecrypt.errorType.KeyUnavailable],
    ['DisabledException', askCryptoDecrypt.errorType.KeyUnavailable],
    ['KMSInvalidStateException', askCryptoDecrypt.errorType.KeyUnavailable],
    ['AccessDeniedException', askCryptoDecrypt.errorType.KeyUnavailable],
    ['ThrottlingException', askCryptoDecrypt.errorType.Throttling],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    const ciphertext = await buildCiphertext('shhh', undefined, randomBytes(32));
    vi.mocked(getCachedUnwrappedDataKey).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { keyName: 'my-key', ciphertext });

    expect(error?.errorType).toBe(expectedType);
  });
});

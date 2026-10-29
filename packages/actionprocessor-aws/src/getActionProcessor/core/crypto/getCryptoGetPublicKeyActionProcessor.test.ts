import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askCryptoGetPublicKey, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedPublicKey } from '../../../logic/kms/getCachedPublicKey';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';

vi.mock('../../../logic/kms/getCachedPublicKey', () => ({ getCachedPublicKey: vi.fn() }));

const kmsError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async (withKey = true) => {
  const settings = [defineAwsServiceAccountInfo('111', 'eu-west-1'), ...(withKey ? [defineSigningKey('my-key')] : [])];
  const processors = await getCryptoGetPublicKeyActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[CryptoActionType.GetPublicKey];
};

describe('getCryptoGetPublicKeyActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getCachedPublicKey).mockReset();
  });

  it("answers the cached public key of the key's deterministic alias", async () => {
    vi.mocked(getCachedPublicKey).mockResolvedValue('-----BEGIN PUBLIC KEY-----');
    const processor = await resolveProcessor();

    const [pem, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error).toBeUndefined();
    expect(pem).toBe('-----BEGIN PUBLIC KEY-----');
    expect(getCachedPublicKey).toHaveBeenCalledWith('alias/my-key-test-app-test-module-development', 'eu-west-1');
  });

  it('fails with KeyNotConfigured for an undeclared key, without touching KMS', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyNotConfigured);
    expect(getCachedPublicKey).not.toHaveBeenCalled();
  });

  it('maps NotFoundException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('NotFoundException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyUnavailable);
  });

  it('maps DisabledException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('DisabledException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyUnavailable);
  });

  it('maps AccessDeniedException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('AccessDeniedException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyUnavailable);
  });

  it('maps ThrottlingException to Throttled', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('ThrottlingException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.Throttled);
  });
});

import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askCryptoSign, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signWithKey } from '../../../logic/kms/signWithKey';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';

vi.mock('../../../logic/kms/signWithKey', () => ({ signWithKey: vi.fn() }));

const kmsError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async (withKey = true) => {
  const settings = [defineAwsServiceAccountInfo('111', 'eu-west-1'), ...(withKey ? [defineSigningKey('my-key')] : [])];
  const processors = await getCryptoSignActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[CryptoActionType.Sign];
};

describe('getCryptoSignActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(signWithKey).mockReset();
  });

  it('signs through KMS and answers the signature base64url encoded', async () => {
    vi.mocked(signWithKey).mockResolvedValue(Buffer.from('sig'));
    const processor = await resolveProcessor();

    const [signature, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error).toBeUndefined();
    expect(signature).toBe(Buffer.from('sig').toString('base64url'));
    expect(signWithKey).toHaveBeenCalledWith('alias/my-key-test-app-test-module-development', 'hello', 'eu-west-1');
  });

  it('fails with KeyNotConfigured for an undeclared key, without touching KMS', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyNotConfigured);
    expect(signWithKey).not.toHaveBeenCalled();
  });

  it('maps NotFoundException to KeyUnavailable', async () => {
    vi.mocked(signWithKey).mockRejectedValue(kmsError('NotFoundException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyUnavailable);
  });

  it('maps DisabledException to KeyUnavailable', async () => {
    vi.mocked(signWithKey).mockRejectedValue(kmsError('DisabledException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyUnavailable);
  });

  it('maps AccessDeniedException to KeyUnavailable', async () => {
    vi.mocked(signWithKey).mockRejectedValue(kmsError('AccessDeniedException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyUnavailable);
  });

  it('maps ThrottlingException to Throttled', async () => {
    vi.mocked(signWithKey).mockRejectedValue(kmsError('ThrottlingException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.Throttled);
  });
});

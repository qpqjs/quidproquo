import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askCryptoVerify, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { generateKeyPairSync, sign } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedPublicKey } from '../../../logic/kms/getCachedPublicKey';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

vi.mock('../../../logic/kms/getCachedPublicKey', () => ({ getCachedPublicKey: vi.fn() }));

const kmsError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async (withKey = true) => {
  const settings = [defineAwsServiceAccountInfo('111', 'eu-west-1'), ...(withKey ? [defineSigningKey('my-key')] : [])];
  const processors = await getCryptoVerifyActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[CryptoActionType.Verify];
};

describe('getCryptoVerifyActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getCachedPublicKey).mockReset();
  });

  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const signatureFor = (message: string) => sign('sha256', Buffer.from(message), keyPair.privateKey).toString('base64url');

  // Verification happens locally against the cached public key: no kms:Verify call on the hot path.
  it('verifies against the cached public key, true for the signed message and false otherwise', async () => {
    vi.mocked(getCachedPublicKey).mockResolvedValue(publicKeyPem);
    const processor = await resolveProcessor();

    const [valid] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hello', signature: signatureFor('hello') });
    const [forOther] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'hellp', signature: signatureFor('hello') });

    expect(valid).toBe(true);
    expect(forOther).toBe(false);
  });

  it('fails with MalformedSignature for a signature that is not base64url', async () => {
    vi.mocked(getCachedPublicKey).mockResolvedValue(publicKeyPem);
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'not base64url!' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.MalformedSignature);
  });

  it('fails with KeyNotConfigured for an undeclared key, without touching KMS', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyNotConfigured);
    expect(getCachedPublicKey).not.toHaveBeenCalled();
  });

  it('maps NotFoundException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('NotFoundException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyUnavailable);
  });

  it('maps DisabledException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('DisabledException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyUnavailable);
  });

  it('maps AccessDeniedException to KeyUnavailable', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('AccessDeniedException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyUnavailable);
  });

  it('maps ThrottlingException to Throttled', async () => {
    vi.mocked(getCachedPublicKey).mockRejectedValue(kmsError('ThrottlingException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyName: 'my-key', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.Throttled);
  });
});

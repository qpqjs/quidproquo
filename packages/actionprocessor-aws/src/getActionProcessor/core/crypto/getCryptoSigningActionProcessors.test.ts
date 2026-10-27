import { generateRs256KeyPair, rs256Sign, rs256Verify } from 'quidproquo-actionprocessor-node';
import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askCryptoGetPublicKey, askCryptoSign, askCryptoVerify, buildTestQpqConfig, CryptoActionType, defineSigningKey } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedPublicKey } from '../../../logic/kms/getCachedPublicKey';
import { signWithKey } from '../../../logic/kms/signWithKey';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

vi.mock('../../../logic/kms/signWithKey', () => ({
  signWithKey: vi.fn(),
}));

vi.mock('../../../logic/kms/getCachedPublicKey', () => ({
  getCachedPublicKey: vi.fn(),
}));

const { privateKeyPem, publicKeyPem } = generateRs256KeyPair();
const EXPECTED_ALIAS = 'alias/my-key-test-app-test-module-development';

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineSigningKey('my-key')]);

const resolveProcessors = async () => ({
  sign: (await getCryptoSignActionProcessor(buildConfig(), {} as any))[CryptoActionType.Sign],
  verify: (await getCryptoVerifyActionProcessor(buildConfig(), {} as any))[CryptoActionType.Verify],
  getPublicKey: (await getCryptoGetPublicKeyActionProcessor(buildConfig(), {} as any))[CryptoActionType.GetPublicKey],
});

describe('signing key action processors (aws)', () => {
  beforeEach(() => {
    vi.mocked(signWithKey).mockReset();
    vi.mocked(getCachedPublicKey).mockReset();
  });

  describe('askCryptoSign', () => {
    it('resolves the alias, signs via KMS and returns the signature as base64url', async () => {
      vi.mocked(signWithKey).mockImplementation(async (_alias, message) => Buffer.from(rs256Sign(privateKeyPem, message), 'base64url'));
      const { sign } = await resolveProcessors();

      const [signature, error] = await invokeProcessor(sign, { keyName: 'my-key', message: 'header.payload' });

      expect(error).toBeUndefined();
      expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(rs256Verify(publicKeyPem, 'header.payload', signature!)).toBe(true);
      expect(signWithKey).toHaveBeenCalledWith(EXPECTED_ALIAS, 'header.payload', 'eu-west-1');
    });

    it('returns KeyNotConfigured without touching KMS when the key is not in config', async () => {
      const { sign } = await resolveProcessors();

      const [, error] = await invokeProcessor(sign, { keyName: 'unknown-key', message: 'x' });

      expect(error?.errorType).toBe(askCryptoSign.errorType.KeyNotConfigured);
      expect(signWithKey).not.toHaveBeenCalled();
    });

    it.each([
      ['NotFoundException', askCryptoSign.errorType.KeyUnavailable],
      ['DisabledException', askCryptoSign.errorType.KeyUnavailable],
      ['KMSInvalidStateException', askCryptoSign.errorType.KeyUnavailable],
      ['AccessDeniedException', askCryptoSign.errorType.KeyUnavailable],
      ['ThrottlingException', askCryptoSign.errorType.Throttling],
    ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
      vi.mocked(signWithKey).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
      const { sign } = await resolveProcessors();

      const [, error] = await invokeProcessor(sign, { keyName: 'my-key', message: 'x' });

      expect(error?.errorType).toBe(expectedType);
    });
  });

  describe('askCryptoVerify', () => {
    it('verifies locally against the cached public key', async () => {
      vi.mocked(getCachedPublicKey).mockResolvedValue(publicKeyPem);
      const { verify } = await resolveProcessors();
      const signature = rs256Sign(privateKeyPem, 'header.payload');

      expect(await invokeProcessor(verify, { keyName: 'my-key', message: 'header.payload', signature })).toEqual([true]);
      expect(await invokeProcessor(verify, { keyName: 'my-key', message: 'header.tampered', signature })).toEqual([false]);
      expect(getCachedPublicKey).toHaveBeenCalledWith(EXPECTED_ALIAS, 'eu-west-1');
    });

    it('returns MalformedSignature for a signature that is not base64url', async () => {
      vi.mocked(getCachedPublicKey).mockResolvedValue(publicKeyPem);
      const { verify } = await resolveProcessors();

      const [, error] = await invokeProcessor(verify, { keyName: 'my-key', message: 'x', signature: 'not base64url!' });

      expect(error?.errorType).toBe(askCryptoVerify.errorType.MalformedSignature);
    });

    it('returns KeyNotConfigured for an undeclared key', async () => {
      const { verify } = await resolveProcessors();

      const [, error] = await invokeProcessor(verify, { keyName: 'unknown-key', message: 'x', signature: 'c2ln' });

      expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyNotConfigured);
      expect(getCachedPublicKey).not.toHaveBeenCalled();
    });

    it('maps a KMS failure fetching the public key to KeyUnavailable', async () => {
      vi.mocked(getCachedPublicKey).mockRejectedValue(Object.assign(new Error('boom'), { name: 'AccessDeniedException' }));
      const { verify } = await resolveProcessors();

      const [, error] = await invokeProcessor(verify, { keyName: 'my-key', message: 'x', signature: 'c2ln' });

      expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyUnavailable);
    });
  });

  describe('askCryptoGetPublicKey', () => {
    it('returns the cached public key pem', async () => {
      vi.mocked(getCachedPublicKey).mockResolvedValue(publicKeyPem);
      const { getPublicKey } = await resolveProcessors();

      expect(await invokeProcessor(getPublicKey, { keyName: 'my-key' })).toEqual([publicKeyPem]);
      expect(getCachedPublicKey).toHaveBeenCalledWith(EXPECTED_ALIAS, 'eu-west-1');
    });

    it('returns KeyNotConfigured for an undeclared key', async () => {
      const { getPublicKey } = await resolveProcessors();

      const [, error] = await invokeProcessor(getPublicKey, { keyName: 'unknown-key' });

      expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyNotConfigured);
    });
  });
});

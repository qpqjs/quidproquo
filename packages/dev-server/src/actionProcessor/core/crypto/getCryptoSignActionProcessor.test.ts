import { askCryptoSign, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { createPublicKey, verify } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';

describe('getCryptoSignActionProcessor', () => {
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

  it('signs with the seeded private key so the published public key verifies it', async () => {
    const settings = [defineSigningKey('my-key')];
    const sign = await resolve(getCryptoSignActionProcessor, CryptoActionType.Sign, settings);
    const getPublicKey = await resolve(getCryptoGetPublicKeyActionProcessor, CryptoActionType.GetPublicKey, settings);

    const [signature, error] = await invokeProcessor(sign, { keyName: 'my-key', message: 'hello' });
    const [pem] = await invokeProcessor(getPublicKey, { keyName: 'my-key' });

    expect(error).toBeUndefined();
    expect(verify('sha256', Buffer.from('hello'), createPublicKey(pem as string), Buffer.from(String(signature), 'base64url'))).toBe(true);
  });

  // Security regression: only the owning service holds the private key, as only it holds kms:Sign deployed.
  it('refuses to sign with a key another module owns', async () => {
    const sign = await resolve(getCryptoSignActionProcessor, CryptoActionType.Sign, [
      defineSigningKey('their-key', { owner: { module: 'other-module' } }),
    ]);

    const [, error] = await invokeProcessor(sign, { keyName: 'their-key', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyUnavailable);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const sign = await resolve(getCryptoSignActionProcessor, CryptoActionType.Sign, []);

    const [, error] = await invokeProcessor(sign, { keyName: 'nope', message: 'hello' });

    expect(error?.errorType).toBe(askCryptoSign.errorType.KeyNotConfigured);
  });
});

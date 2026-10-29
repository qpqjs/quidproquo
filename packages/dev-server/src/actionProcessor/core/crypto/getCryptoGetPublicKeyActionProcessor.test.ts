import { askCryptoGetPublicKey, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';

describe('getCryptoGetPublicKeyActionProcessor', () => {
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

  it("publishes the seeded key pair's public key as PEM, stable across instances", async () => {
    const getPublicKey = await resolve(getCryptoGetPublicKeyActionProcessor, CryptoActionType.GetPublicKey, [defineSigningKey('my-key')]);
    const again = await resolve(getCryptoGetPublicKeyActionProcessor, CryptoActionType.GetPublicKey, [defineSigningKey('my-key')]);

    const [pem, error] = await invokeProcessor(getPublicKey, { keyName: 'my-key' });
    const [pemAgain] = await invokeProcessor(again, { keyName: 'my-key' });

    expect(error).toBeUndefined();
    expect(pem).toContain('BEGIN PUBLIC KEY');
    expect(pemAgain).toBe(pem);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const getPublicKey = await resolve(getCryptoGetPublicKeyActionProcessor, CryptoActionType.GetPublicKey, []);

    const [, error] = await invokeProcessor(getPublicKey, { keyName: 'nope' });

    expect(error?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyNotConfigured);
  });
});

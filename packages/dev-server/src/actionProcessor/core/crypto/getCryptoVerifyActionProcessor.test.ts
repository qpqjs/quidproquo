import { askCryptoVerify, CryptoActionType, defineSigningKey } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

describe('getCryptoVerifyActionProcessor', () => {
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

  it('verifies a signature the sign processor made, and rejects it for another message', async () => {
    const settings = [defineSigningKey('my-key')];
    const sign = await resolve(getCryptoSignActionProcessor, CryptoActionType.Sign, settings);
    const verifyProcessor = await resolve(getCryptoVerifyActionProcessor, CryptoActionType.Verify, settings);
    const [signature] = await invokeProcessor(sign, { keyName: 'my-key', message: 'hello' });

    const [valid] = await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'hello', signature });
    const [forOther] = await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'hellp', signature });

    expect(valid).toBe(true);
    expect(forOther).toBe(false);
  });

  it('fails with MalformedSignature for a signature that is not base64url', async () => {
    const verifyProcessor = await resolve(getCryptoVerifyActionProcessor, CryptoActionType.Verify, [defineSigningKey('my-key')]);

    const [, error] = await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'x', signature: 'not base64url!' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.MalformedSignature);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const verifyProcessor = await resolve(getCryptoVerifyActionProcessor, CryptoActionType.Verify, []);

    const [, error] = await invokeProcessor(verifyProcessor, { keyName: 'nope', message: 'x', signature: 'x' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.KeyNotConfigured);
  });
});

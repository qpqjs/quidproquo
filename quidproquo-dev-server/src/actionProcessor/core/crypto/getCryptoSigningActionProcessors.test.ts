import {
  ActionProcessor,
  askCryptoGetPublicKey,
  askCryptoSign,
  askCryptoSignJwt,
  askCryptoVerify,
  askCryptoVerifyJwt,
  buildTestQpqConfig,
  CryptoActionType,
  defineSigningKey,
} from 'quidproquo-core';

import { createPublicKey, verify } from 'crypto';
import { existsSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getCryptoActionProcessor } from './getCryptoActionProcessor';

describe('signing key action processors (dev server)', () => {
  let runtimePath: string;
  let sign: ActionProcessor<any>;
  let verifyProcessor: ActionProcessor<any>;
  let getPublicKey: ActionProcessor<any>;

  beforeEach(async () => {
    runtimePath = await mkdtemp(join(tmpdir(), 'qpq-signing-test-'));

    const qpqConfig = buildTestQpqConfig([defineSigningKey('my-key')]);
    const processors = await getCryptoActionProcessor({ runtimePath } as any)(qpqConfig, (() => null) as any);

    sign = processors[CryptoActionType.Sign];
    verifyProcessor = processors[CryptoActionType.Verify];
    getPublicKey = processors[CryptoActionType.GetPublicKey];
  });

  afterEach(async () => {
    await rm(runtimePath, { recursive: true, force: true });
  });

  it('signs offline, verifies with the published public key, and seeds the key store', async () => {
    const [signature] = await invokeProcessor(sign, { keyName: 'my-key', message: 'header.payload' });

    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(existsSync(join(runtimePath, 'signingKeys', 'test-module.json'))).toBe(true);

    expect(await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'header.payload', signature })).toEqual([true]);
    expect(await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'header.tampered', signature })).toEqual([false]);

    // The published pem is a real SPKI key that verifies the same signature with plain node crypto
    const [publicKeyPem] = await invokeProcessor(getPublicKey, { keyName: 'my-key' });
    expect(publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    expect(verify('sha256', Buffer.from('header.payload'), createPublicKey(publicKeyPem), Buffer.from(signature, 'base64url'))).toBe(true);
  });

  it('refuses to sign with a key owned by another module, but still publishes its public key', async () => {
    const foreignConfig = buildTestQpqConfig([defineSigningKey('their-key', { owner: { module: 'other-module' } })]);
    const processors = await getCryptoActionProcessor({ runtimePath } as any)(foreignConfig, (() => null) as any);

    const [signature, error] = await invokeProcessor(processors[CryptoActionType.Sign], { keyName: 'their-key', message: 'header.payload' });
    expect(signature).toBeUndefined();
    expect(error).toMatchObject({ errorType: askCryptoSign.errorType.KeyUnavailable, errorText: 'Access denied to signing key: [their-key]' });

    const [publicKeyPem] = await invokeProcessor(processors[CryptoActionType.GetPublicKey], { keyName: 'their-key' });
    expect(publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
  });

  it('is deterministic and stable across processor instances (key pair persisted on disk)', async () => {
    const [first] = await invokeProcessor(sign, { keyName: 'my-key', message: 'header.payload' });

    const rebuilt = await getCryptoActionProcessor({ runtimePath } as any)(buildTestQpqConfig([defineSigningKey('my-key')]), (() => null) as any);
    const [second] = await invokeProcessor(rebuilt[CryptoActionType.Sign], { keyName: 'my-key', message: 'header.payload' });

    expect(second).toBe(first);
  });

  it('fails with MalformedSignature for a signature that is not base64url', async () => {
    const [, error] = await invokeProcessor(verifyProcessor, { keyName: 'my-key', message: 'x', signature: 'not base64url!' });

    expect(error?.errorType).toBe(askCryptoVerify.errorType.MalformedSignature);
  });

  it('fails with KeyNotConfigured for an undeclared key', async () => {
    const [, signError] = await invokeProcessor(sign, { keyName: 'unknown-key', message: 'x' });
    expect(signError?.errorType).toBe(askCryptoSign.errorType.KeyNotConfigured);

    const [, verifyError] = await invokeProcessor(verifyProcessor, { keyName: 'unknown-key', message: 'x', signature: 'c2ln' });
    expect(verifyError?.errorType).toBe(askCryptoVerify.errorType.KeyNotConfigured);

    const [, publicKeyError] = await invokeProcessor(getPublicKey, { keyName: 'unknown-key' });
    expect(publicKeyError?.errorType).toBe(askCryptoGetPublicKey.errorType.KeyNotConfigured);
  });

  it('exposes the actions the jwt stories compose', () => {
    // A smoke check that the story-level helpers resolve to these processors' action types.
    expect(askCryptoSignJwt).toBeTypeOf('function');
    expect(askCryptoVerifyJwt).toBeTypeOf('function');
  });
});

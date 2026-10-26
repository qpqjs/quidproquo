import { ConfigActionType, CryptoActionType, FileActionType, SecureTokenActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { redactStoryResult } from '../redactStoryResult';
import { secretResultParser } from './secretResultParser';

describe('secretResultParser', () => {
  it('redacts and reports the result of secret reads and decrypts, leaving payloads and other actions alone', () => {
    const log = {
      correlation: 'c1',
      history: [
        { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'db' } }, res: ['s3cret-value', undefined] },
        { act: { type: CryptoActionType.Decrypt, payload: { keyName: 'k', ciphertext: 'ct' } }, res: [{ card: '4111', exp: 12 }, undefined] },
        { act: { type: ConfigActionType.GetParameter, payload: { parameterName: 'p' } }, res: ['param-value', undefined] },
      ],
    } as any;

    const { redactedLog, redactions } = secretResultParser(log);

    expect(redactedLog.history[0].act.payload).toEqual({ secretName: 'db' });
    expect(redactedLog.history[0].res).toEqual([REDACTED_STRING, undefined]);
    expect(redactedLog.history[1].res).toEqual([{ card: REDACTED_STRING, exp: 12 }, undefined]);
    expect(redactedLog.history[2]).toBe(log.history[2]);
    expect(redactions.sort()).toEqual(['4111', 's3cret-value']);
  });

  it('redacts and reports a generated secure token', () => {
    const token = 'ab'.repeat(32);
    const log = {
      correlation: 'c1',
      history: [{ act: { type: SecureTokenActionType.Generate, payload: { byteLength: 32 } }, res: [token, undefined] }],
    } as any;

    const { redactedLog, redactions } = secretResultParser(log);

    expect(redactedLog.history[0].act.payload).toEqual({ byteLength: 32 });
    expect(redactedLog.history[0].res).toEqual([REDACTED_STRING, undefined]);
    expect(redactions).toEqual([token]);
  });

  it('redacts and reports a presigned file url so the capability does not sit in the admin log', () => {
    const url = 'https://bucket.s3.amazonaws.com/scope/file.pdf?X-Amz-Signature=abcdef0123456789&X-Amz-Expires=300';
    const log = {
      correlation: 'c1',
      history: [
        {
          act: { type: FileActionType.GenerateTemporarySecureUrl, payload: { drive: 'd', filepath: 'file.pdf', expirationMs: 300000 } },
          res: [url, undefined],
        },
        {
          act: { type: FileActionType.GenerateTemporaryUploadSecureUrl, payload: { drive: 'd', filepath: 'up.pdf', expirationMs: 300000 } },
          res: [`${url}&upload=1`, undefined],
        },
        { act: { type: 'Log/Create', payload: { msg: `sent ${url} to the client` } }, res: [undefined, undefined] },
      ],
    } as any;

    const redacted = redactStoryResult(log);

    expect(redacted.history[0].act.payload).toEqual({ drive: 'd', filepath: 'file.pdf', expirationMs: 300000 });
    expect(redacted.history[0].res).toEqual([REDACTED_STRING, undefined]);
    expect(redacted.history[1].res).toEqual([REDACTED_STRING, undefined]);
    expect(redacted.history[2].act.payload.msg).toBe(`sent ${REDACTED_STRING} to the client`);
  });

  it('through the pipeline, sweeps a generated token from everywhere it went in the log', () => {
    const token = '0f'.repeat(32);
    const log = {
      correlation: 'c1',
      history: [
        { act: { type: SecureTokenActionType.Generate, payload: { byteLength: 32 } }, res: [token, undefined] },
        {
          act: { type: 'KeyValueStore/Upsert', payload: { item: { link: `https://sign.example.com/#${token}`, note: `made ${token}` } } },
          res: [undefined, undefined],
        },
      ],
    } as any;

    expect(JSON.stringify(redactStoryResult(log))).not.toContain(token);
  });

  it('leaves an errored secret read untouched so the error stays readable', () => {
    const log = {
      correlation: 'c1',
      history: [
        { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'db' } }, res: [undefined, { errorType: 'NotFound', errorText: 'no db' }] },
      ],
    } as any;

    const { redactedLog, redactions } = secretResultParser(log);

    expect(redactedLog.history[0]).toBe(log.history[0]);
    expect(redactions).toEqual([]);
  });
});

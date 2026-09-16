import { ConfigActionType, CryptoActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../constants/REDACTED_STRING';
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

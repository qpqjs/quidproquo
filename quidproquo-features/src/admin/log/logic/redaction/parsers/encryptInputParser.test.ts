import { CryptoActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { encryptInputParser } from './encryptInputParser';

describe('encryptInputParser', () => {
  it('redacts every string in an encrypt payload, reports them, and leaves the result and other actions alone', () => {
    const log = {
      correlation: 'c1',
      history: [
        { act: { type: CryptoActionType.Encrypt, payload: { keyName: 'k', plaintext: 'secret', context: { a: 'b' } } }, res: ['cipher', undefined] },
        { act: { type: CryptoActionType.Decrypt, payload: { keyName: 'k', ciphertext: 'cipher' } }, res: ['plain', undefined] },
      ],
    } as any;

    const { redactedLog, redactions } = encryptInputParser(log);

    expect(redactedLog.history[0].act.payload).toEqual({ keyName: REDACTED_STRING, plaintext: REDACTED_STRING, context: { a: REDACTED_STRING } });
    expect(redactedLog.history[0].res).toEqual(['cipher', undefined]);
    expect(redactedLog.history[1]).toBe(log.history[1]);
    expect(redactions.sort()).toEqual(['b', 'k', 'secret']);
  });
});

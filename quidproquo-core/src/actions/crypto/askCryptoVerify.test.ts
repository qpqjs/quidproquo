import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { askCryptoVerify } from './askCryptoVerify';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoVerify', () => {
  it('should yield an action with correct type and payload and return the verdict given to next()', () => {
    expectGenerator(askCryptoVerify('my-signing-key', 'header.payload', 'c2lnbmF0dXJl'))
      .toYield({
        type: CryptoActionType.Verify,
        payload: { keyName: 'my-signing-key', message: 'header.payload', signature: 'c2lnbmF0dXJl' },
      })
      .whenGiven(false)
      .thenReturn(false);
  });

  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askCryptoVerify.errorType).toEqual({
      KeyNotConfigured: `${CryptoActionType.Verify}-KeyNotConfigured`,
      MalformedSignature: `${CryptoActionType.Verify}-MalformedSignature`,
      KeyUnavailable: `${CryptoActionType.Verify}-KeyUnavailable`,
      Throttling: `${CryptoActionType.Verify}-Throttling`,
    });
  });
});

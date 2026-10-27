import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { askCryptoGetPublicKey } from './askCryptoGetPublicKey';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoGetPublicKey', () => {
  it('should yield an action with correct type and payload and return the pem given to next()', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----';

    expectGenerator(askCryptoGetPublicKey('my-signing-key'))
      .toYield({
        type: CryptoActionType.GetPublicKey,
        payload: { keyName: 'my-signing-key' },
      })
      .whenGiven(pem)
      .thenReturn(pem);
  });

  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askCryptoGetPublicKey.errorType).toEqual({
      KeyNotConfigured: `${CryptoActionType.GetPublicKey}-KeyNotConfigured`,
      KeyUnavailable: `${CryptoActionType.GetPublicKey}-KeyUnavailable`,
      Throttling: `${CryptoActionType.GetPublicKey}-Throttling`,
    });
  });
});

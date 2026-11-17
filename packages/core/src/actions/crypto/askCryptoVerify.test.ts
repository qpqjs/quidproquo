import { expectGenerator } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askCryptoVerify } from './askCryptoVerify';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoVerify', () => {
  it('should yield an action with correct type and payload and return the verdict given to next()', () => {
    expectGenerator(askCryptoVerify('my-signing-key', 'header.payload', 'c2lnbmF0dXJl'))
      .toYield({
        type: CryptoActionType.Verify,
        payload: { keyName: 'my-signing-key', message: 'header.payload', signature: 'c2lnbmF0dXJl', messageEncoding: 'utf8' },
      })
      .whenGiven(false)
      .thenReturn(false);
  });

  it('carries a base64 message encoding through to the payload, for verifying binary data', () => {
    expectGenerator(askCryptoVerify('my-signing-key', 'AAECAw==', 'c2lnbmF0dXJl', 'base64'))
      .toYield({
        type: CryptoActionType.Verify,
        payload: { keyName: 'my-signing-key', message: 'AAECAw==', signature: 'c2lnbmF0dXJl', messageEncoding: 'base64' },
      })
      .whenGiven(true)
      .thenReturn(true);
  });

  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askCryptoVerify.errorType).toEqual({
      KeyNotConfigured: `${CryptoActionType.Verify}-KeyNotConfigured`,
      MalformedSignature: `${CryptoActionType.Verify}-MalformedSignature`,
      MalformedMessage: `${CryptoActionType.Verify}-MalformedMessage`,
      KeyUnavailable: `${CryptoActionType.Verify}-KeyUnavailable`,
      Throttled: `${CryptoActionType.Verify}-Throttled`,
    });
  });
});

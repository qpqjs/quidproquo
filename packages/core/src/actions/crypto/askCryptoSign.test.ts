import { expectGenerator } from '@qpqjs/testing';
import { runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askCryptoSign } from './askCryptoSign';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoSign', () => {
  it('should yield an action with correct type and payload and return the signature given to next()', () => {
    const mockSignature = 'c2lnbmF0dXJl';

    expectGenerator(askCryptoSign('my-signing-key', 'header.payload'))
      .toYield({
        type: CryptoActionType.Sign,
        payload: { keyName: 'my-signing-key', message: 'header.payload', messageEncoding: 'utf8' },
      })
      .whenGiven(mockSignature)
      .thenReturn(mockSignature);
  });

  it('carries a base64 message encoding through to the payload, for signing binary data', () => {
    expectGenerator(askCryptoSign('my-signing-key', 'AAECAw==', 'base64'))
      .toYield({
        type: CryptoActionType.Sign,
        payload: { keyName: 'my-signing-key', message: 'AAECAw==', messageEncoding: 'base64' },
      })
      .whenGiven('c2ln')
      .thenReturn('c2ln');
  });

  it('propagates a processor failure as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askCryptoSign('missing-key', 'value'), {
        [CryptoActionType.Sign]: throwsError(askCryptoSign.errorType.KeyNotConfigured, 'Signing key not configured'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${askCryptoSign.errorType.KeyNotConfigured}: Signing key not configured`);
  });

  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askCryptoSign.errorType).toEqual({
      KeyNotConfigured: `${CryptoActionType.Sign}-KeyNotConfigured`,
      MalformedMessage: `${CryptoActionType.Sign}-MalformedMessage`,
      KeyUnavailable: `${CryptoActionType.Sign}-KeyUnavailable`,
      Throttled: `${CryptoActionType.Sign}-Throttled`,
    });
  });
});

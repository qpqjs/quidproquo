import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askCryptoDecrypt } from './askCryptoDecrypt';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoDecrypt', () => {
  describe('askCryptoDecrypt', () => {
    it('should yield an action with correct type and payload', () => {
      const keyName = 'my-crypto-key';
      const ciphertext = 'qpqcrypto:v1:abc123';

      expectGenerator(askCryptoDecrypt(keyName, ciphertext)).toYield({
        type: CryptoActionType.Decrypt,
        payload: { keyName, ciphertext, context: undefined },
      });
    });

    it('should pass the context through and return the plaintext given to next()', () => {
      const keyName = 'my-crypto-key';
      const ciphertext = 'qpqcrypto:v1:abc123';
      const context = { tenantId: 'tenant-a' };
      const mockPlaintext = 'super-secret-value';

      expectGenerator(askCryptoDecrypt(keyName, ciphertext, context))
        .toYield({
          type: CryptoActionType.Decrypt,
          payload: { keyName, ciphertext, context },
        })
        .whenGiven(mockPlaintext)
        .thenReturn(mockPlaintext);
    });

    it('propagates a context mismatch as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askCryptoDecrypt('my-crypto-key', 'qpqcrypto:v1:abc123', { tenantId: 'tenant-b' }), {
          [CryptoActionType.Decrypt]: throwsError(askCryptoDecrypt.errorType.ContextMismatch, 'Crypto context mismatch'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askCryptoDecrypt.errorType.ContextMismatch}: Crypto context mismatch`);
    });
  });

  describe('errorType', () => {
    it('lists every error the processor can produce, namespaced by the action type', () => {
      expect(askCryptoDecrypt.errorType).toEqual({
        KeyNotConfigured: `${CryptoActionType.Decrypt}-KeyNotConfigured`,
        ContextMismatch: `${CryptoActionType.Decrypt}-ContextMismatch`,
        MalformedCiphertext: `${CryptoActionType.Decrypt}-MalformedCiphertext`,
        KeyUnavailable: `${CryptoActionType.Decrypt}-KeyUnavailable`,
        Throttling: `${CryptoActionType.Decrypt}-Throttling`,
      });
    });
  });
});

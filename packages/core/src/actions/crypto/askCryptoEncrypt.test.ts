import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askCryptoEncrypt } from './askCryptoEncrypt';
import { CryptoActionType } from './CryptoActionType';

describe('askCryptoEncrypt', () => {
  describe('askCryptoEncrypt', () => {
    it('should yield an action with correct type and payload', () => {
      const keyName = 'my-crypto-key';
      const plaintext = 'super-secret-value';

      expectGenerator(askCryptoEncrypt(keyName, plaintext)).toYield({
        type: CryptoActionType.Encrypt,
        payload: { keyName, plaintext, context: undefined },
      });
    });

    it('should pass the context through and return the ciphertext given to next()', () => {
      const keyName = 'my-crypto-key';
      const plaintext = 'super-secret-value';
      const context = { tenantId: 'tenant-a' };
      const mockCiphertext = 'qpqcrypto:v1:abc123';

      expectGenerator(askCryptoEncrypt(keyName, plaintext, context))
        .toYield({
          type: CryptoActionType.Encrypt,
          payload: { keyName, plaintext, context },
        })
        .whenGiven(mockCiphertext)
        .thenReturn(mockCiphertext);
    });

    it('should handle empty plaintext', () => {
      const mockCiphertext = 'qpqcrypto:v1:empty';

      expectGenerator(askCryptoEncrypt('my-crypto-key', ''))
        .toYield({
          type: CryptoActionType.Encrypt,
          payload: { keyName: 'my-crypto-key', plaintext: '', context: undefined },
        })
        .whenGiven(mockCiphertext)
        .thenReturn(mockCiphertext);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askCryptoEncrypt('missing-key', 'value'), {
          [CryptoActionType.Encrypt]: throwsError(askCryptoEncrypt.errorType.KeyNotConfigured, 'Crypto key not configured'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askCryptoEncrypt.errorType.KeyNotConfigured}: Crypto key not configured`);
    });
  });

  describe('errorType', () => {
    it('lists every error the processor can produce, namespaced by the action type', () => {
      expect(askCryptoEncrypt.errorType).toEqual({
        KeyNotConfigured: `${CryptoActionType.Encrypt}-KeyNotConfigured`,
        KeyUnavailable: `${CryptoActionType.Encrypt}-KeyUnavailable`,
        Throttling: `${CryptoActionType.Encrypt}-Throttling`,
      });
    });
  });
});

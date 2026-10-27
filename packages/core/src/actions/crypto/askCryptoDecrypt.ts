import { createActionRequester } from '../../types';
import { CryptoActionType } from './CryptoActionType';
import { CryptoContext } from './CryptoContext';

export const askCryptoDecrypt = createActionRequester<string>()({
  actionType: CryptoActionType.Decrypt,
  errorTypes: [
    'KeyNotConfigured', // no defineCryptoKey for keyName in the service config
    'ContextMismatch', // supplied context differs from the encrypt-time context; probable scoping bug, do not retry
    'MalformedCiphertext', // ciphertext is corrupt, truncated, or not a qpq crypto blob
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttling', // request rate exceeded
  ],
  getPayload: (keyName: string, ciphertext: string, context?: CryptoContext) => ({ keyName, ciphertext, context }),
});

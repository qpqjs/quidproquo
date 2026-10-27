import { createActionRequester } from '../../types';
import { CryptoActionType } from './CryptoActionType';
import { CryptoContext } from './CryptoContext';

export const askCryptoEncrypt = createActionRequester<string>()({
  actionType: CryptoActionType.Encrypt,
  errorTypes: [
    'KeyNotConfigured', // no defineCryptoKey for keyName in the service config
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttling', // request rate exceeded
  ],
  getPayload: (keyName: string, plaintext: string, context?: CryptoContext) => ({ keyName, plaintext, context }),
});

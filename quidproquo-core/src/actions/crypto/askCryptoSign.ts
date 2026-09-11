import { createActionRequester } from '../../types';
import { CryptoActionType } from './CryptoActionType';

// Signs `message` with the private half of a signing key (RS256: RSASSA-PKCS1-v1_5
// over SHA-256) and returns the signature as base64url. RS256 is deterministic, so
// the same key + message always yields the same signature. The private key never
// leaves the provider - nothing sensitive passes through the story or its logs.
export const askCryptoSign = createActionRequester<string>()({
  actionType: CryptoActionType.Sign,
  errorTypes: [
    'KeyNotConfigured', // no defineSigningKey for keyName in the service config
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttling', // request rate exceeded
  ],
  getPayload: (keyName: string, message: string) => ({ keyName, message }),
});

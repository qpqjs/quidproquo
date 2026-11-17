import { createActionRequester } from '../../logic/actions';
import { CryptoActionType } from './CryptoActionType';
import { CryptoMessageEncoding } from './types/CryptoMessageEncoding';

// Signs `message` with the private half of a signing key (RS256: RSASSA-PKCS1-v1_5
// over SHA-256) and returns the signature as base64url. RS256 is deterministic, so
// the same key + message always yields the same signature. The private key never
// leaves the provider - nothing sensitive passes through the story or its logs.
// `message` is text unless `messageEncoding` is 'base64', which signs the decoded
// bytes (binary data cannot be passed as text).
export const askCryptoSign = createActionRequester<string>()({
  actionType: CryptoActionType.Sign,
  errorTypes: [
    'KeyNotConfigured', // no defineSigningKey for keyName in the service config
    'MalformedMessage', // messageEncoding is 'base64' and message is not valid base64
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttled', // request rate exceeded
  ],
  getPayload: (keyName: string, message: string, messageEncoding: CryptoMessageEncoding = 'utf8') => ({ keyName, message, messageEncoding }),
});

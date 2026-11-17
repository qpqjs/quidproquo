import { createActionRequester } from '../../logic/actions';
import { CryptoActionType } from './CryptoActionType';
import { CryptoMessageEncoding } from './types/CryptoMessageEncoding';

// Verifies a base64url RS256 signature produced by askCryptoSign against
// `message` using the public half of the signing key. Resolves to false for a
// signature that does not match; a signature that is not even decodable is a
// MalformedSignature error rather than false, so a wiring bug is distinguishable
// from a forged token. `messageEncoding` must match the one the message was
// signed with.
export const askCryptoVerify = createActionRequester<boolean>()({
  actionType: CryptoActionType.Verify,
  errorTypes: [
    'KeyNotConfigured', // no defineSigningKey for keyName in the service config
    'MalformedSignature', // signature is not valid base64url
    'MalformedMessage', // messageEncoding is 'base64' and message is not valid base64
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttled', // request rate exceeded
  ],
  getPayload: (keyName: string, message: string, signature: string, messageEncoding: CryptoMessageEncoding = 'utf8') => ({
    keyName,
    message,
    signature,
    messageEncoding,
  }),
});

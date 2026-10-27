import { createActionRequester } from '../../types';
import { CryptoActionType } from './CryptoActionType';

// Verifies a base64url RS256 signature produced by askCryptoSign against
// `message` using the public half of the signing key. Resolves to false for a
// signature that does not match; a signature that is not even decodable is a
// MalformedSignature error rather than false, so a wiring bug is distinguishable
// from a forged token.
export const askCryptoVerify = createActionRequester<boolean>()({
  actionType: CryptoActionType.Verify,
  errorTypes: [
    'KeyNotConfigured', // no defineSigningKey for keyName in the service config
    'MalformedSignature', // signature is not valid base64url
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttling', // request rate exceeded
  ],
  getPayload: (keyName: string, message: string, signature: string) => ({ keyName, message, signature }),
});

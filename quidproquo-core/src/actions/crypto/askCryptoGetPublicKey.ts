import { createActionRequester } from '../../types';
import { CryptoActionType } from './CryptoActionType';

// Returns the public half of a signing key as an SPKI PEM string. Not sensitive:
// it can only verify, never sign. Hand it to third parties (a JWKS endpoint, a
// partner service) so they can check signatures without calling back in.
export const askCryptoGetPublicKey = createActionRequester<string>()({
  actionType: CryptoActionType.GetPublicKey,
  errorTypes: [
    'KeyNotConfigured', // no defineSigningKey for keyName in the service config
    'KeyUnavailable', // key disabled, deleted, or access denied
    'Throttling', // request rate exceeded
  ],
  getPayload: (keyName: string) => ({ keyName }),
});

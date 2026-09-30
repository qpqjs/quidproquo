import { createActionRequester } from '../../types';
import { SecureTokenActionType } from './SecureTokenActionType';

/**
 * A new random token to use as a secret (a signing link, an API secret): `byteLength` bytes from the
 * platform's secure random source, as lowercase hex (so 32 bytes, the default and 256 bits, is 64
 * characters). The admin log redaction treats the result as a secret: it's blanked in this action's
 * entry and swept from every other string in the story's log.
 */
export const askSecureTokenGenerate = createActionRequester<string>()({
  actionType: SecureTokenActionType.Generate,
  errorTypes: [
    'InvalidByteLength', // not a whole number from 1 to SECURE_TOKEN_MAX_BYTE_LENGTH
    'RandomSourceUnavailable', // no Web Crypto API in this runtime
  ],
  getPayload: (byteLength: number = 32) => ({ byteLength }),
});

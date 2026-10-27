import { createHmac } from 'crypto';

import { memoFunc } from '../../cache/memoFunc';

/**
 * Computes the Cognito SECRET_HASH for an app client with a secret: the base64
 * HMAC-SHA256 of username + clientId, keyed by the client secret. Memoized
 * because every auth call for the same user recomputes the same value.
 */
export const calculateSecretHash = memoFunc((username: string, clientId: string, clientSecret: string): string => {
  return createHmac('sha256', clientSecret).update(`${username}${clientId}`).digest('base64');
});

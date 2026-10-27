import jwksClient, { JwksClient } from 'jwks-rsa';

import { memoFunc } from '../cache/memoFunc';

/**
 * Returns the JWKS client for a Cognito jwks.json uri. Memoized because jwks-rsa
 * caches fetched signing keys per client instance; a fresh client per verification
 * would refetch the pool's JWKS over HTTP on every call.
 */
export const getCognitoJwksClient = memoFunc((jwksUri: string): JwksClient => jwksClient({ jwksUri }));

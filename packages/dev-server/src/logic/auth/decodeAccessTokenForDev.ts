import { DecodedAccessToken, Nullable } from '@qpqjs/core';

import { verifyDevJwt } from './devJwt';

type DevJwtClaims = {
  sub?: string;
  userId?: string;
  username?: string;
  id?: string;
  exp?: number;
  iat?: number;
};

/**
 * The dev server's access token decoder: verifies the HS256 signature against the directory's
 * local secret (so a token from another checkout, or a hand-rolled one, is refused) and reads
 * the claims. No pool is consulted; expiry is checked here unless the caller opts out.
 */
export const decodeAccessTokenForDev = (
  secret: string,
  userDirectoryName: string,
  accessToken?: string,
  ignoreExpiration: boolean = false,
): Nullable<DecodedAccessToken> => {
  if (!accessToken) {
    return null;
  }

  const decoded = verifyDevJwt<DevJwtClaims>(secret, accessToken);
  if (!decoded) {
    return null;
  }

  // Extract user info from various possible fields
  const userId = decoded.sub || decoded.id || decoded.userId || '';
  const username = decoded.username || decoded.userId || decoded.sub || decoded.id || '';
  const exp = decoded.exp || 0;

  const isExpired = !ignoreExpiration && exp > 0 && exp < Math.floor(Date.now() / 1000);

  return {
    userId,
    username,
    exp,
    wasValid: !isExpired,
    userDirectory: userDirectoryName,
  };
};

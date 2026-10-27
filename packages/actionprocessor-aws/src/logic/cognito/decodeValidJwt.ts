import { DecodedAccessToken, Nullable } from '@qpqjs/core';

import { decode, verify } from 'jsonwebtoken';

import { getCognitoJwksClient } from './getCognitoJwksClient';

// The jsonwebtoken lib types every claim as optional, so the Cognito
// access-token claims this decoder relies on are typed here.
type CognitoAccessTokenPayload = {
  sub: string;
  token_use: string;
  username: string;
  exp: number;
};

/**
 * Verifies a Cognito access token and returns its decoded qpq shape: signature is
 * checked against the pool's JWKS (RS256 only), plus issuer, expiry (unless
 * ignoreExpiration) and token_use. Returns null for anything that fails; failures
 * are logged in summary form only, never the token itself.
 */
export const decodeValidJwt = async (
  userPoolId: string,
  region: string,
  ignoreExpiration: boolean,
  accessToken?: string,
): Promise<Nullable<Omit<DecodedAccessToken, 'userDirectory'>>> => {
  if (!accessToken) {
    return null;
  }

  try {
    const decodedToken = decode(accessToken, { complete: true });
    if (!decodedToken) {
      return null;
    }

    const client = getCognitoJwksClient(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`);

    const key = await client.getSigningKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    const payload = verify(accessToken, signingKey, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      ignoreExpiration,
    }) as CognitoAccessTokenPayload;

    // An id token from the same pool passes signature verification too; only
    // access tokens are acceptable here.
    if (payload.token_use !== 'access') {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      exp: payload.exp,
      wasValid: true,
    };
  } catch {
    return null;
  }
};

import { DecodedAccessToken } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

/**
 * Dev server optimized access token decoder.
 *
 * In development:
 * - Skips AWS CloudFormation API calls
 * - Skips JWT signature verification (trusts the token)
 * - Just decodes the JWT payload for user info
 *
 * This is ONLY safe for development where:
 * - Performance matters more than security
 * - We trust the tokens being sent
 * - We want to avoid AWS dependencies
 */
export const decodeAccessTokenForDev = (
  userDirectoryName: string,
  accessToken?: string,
  ignoreExpiration: boolean = false,
): DecodedAccessToken | null => {
  if (!accessToken) {
    return null;
  }

  try {
    // Just decode the JWT without verification (dev only!)
    const decoded = qpqWebServerUtils.unsafeDecodeJWTPayload<{
      sub?: string;
      userId?: string;
      username?: string;
      id?: string;
      exp?: number;
      iat?: number;
      client_id?: string;
    }>(accessToken);

    if (!decoded) {
      return null;
    }

    // Extract user info from various possible fields
    const userId = decoded.sub || decoded.id || decoded.userId || '';
    const username = decoded.username || decoded.userId || decoded.sub || decoded.id || '';
    const exp = decoded.exp || 0;

    // Check expiration if needed
    const isExpired = !ignoreExpiration && exp > 0 && exp < Math.floor(Date.now() / 1000);
    const wasValid = !isExpired;

    return {
      userId,
      username,
      exp,
      wasValid,
      userDirectory: userDirectoryName,
    };
  } catch (error) {
    console.log('Failed to decode JWT in dev mode:', error);
    return null;
  }
};

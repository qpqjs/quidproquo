import {
  AuthenticateUserChallenge,
  AuthenticateUserResponse,
  AuthenticationInfo,
  generateUuidV5,
  getQpqIsoDateTimeFromDate,
  Nullable,
  QPQConfig,
  qpqCoreUtils,
  UuidNamespace,
} from '@qpqjs/core';

import { resolveOwnedStoreLocation } from '../config/resolveOwnedStoreLocation';
import { signDevJwt } from './devJwt';

/**
 * Dev server auth helpers.
 *
 * The dev server has no real user directory: any username / password combination is
 * accepted and a JWT is minted for it, signed (HS256) with the directory's local secret so
 * the decoders here can verify it and refuse anything else. The secret is random per
 * checkout, so the token is worthless anywhere else.
 *
 * This is ONLY safe for development.
 */

export const DEV_USER_EMAIL = 'devuser@example.com';

const DEV_ACCESS_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;
const DEV_REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

export const resolveDevUsername = (username?: Nullable<string>): string => username || DEV_USER_EMAIL;

// The identity of a user directory once cross-module ownership is applied. Two
// services declaring the same directory name resolve to different identities;
// a directory referenced via `owner` resolves to the owning service's identity.
export type DevUserDirectory = {
  serviceName: string;
  directoryName: string;
};

// Owner handling is resolveOwnedStoreLocation's, as for the AWS user pool lookup.
export const resolveDevUserDirectory = (userDirectoryName: string, qpqConfig: QPQConfig): DevUserDirectory => {
  const userDirectoryConfig = qpqCoreUtils.resolveUserDirectoryOrThrow(userDirectoryName, qpqConfig);

  const { serviceName, key } = resolveOwnedStoreLocation(userDirectoryName, userDirectoryConfig.owner, qpqConfig);

  return { serviceName, directoryName: key };
};

// Fixed namespace so userIds stay stable across dev server restarts.
const devUserIdNamespace = generateUuidV5('@qpqjs/dev-server/user-id', UuidNamespace.url);

// Derives a deterministic userId from the directory identity and the login, so the
// same email is always the same user in dev ~ and, like Cognito user pools, the same
// email in two different directories is two different users. Emails are compared
// case-insensitively, hence the lowercase.
export const createDevUserId = (userDirectory: DevUserDirectory, username?: Nullable<string>): string => {
  const resolvedUsername = resolveDevUsername(username);

  return generateUuidV5(`${userDirectory.serviceName}/${userDirectory.directoryName}/${resolvedUsername.trim().toLowerCase()}`, devUserIdNamespace);
};

export const createDevJwt = (
  secret: string,
  userDirectory: DevUserDirectory,
  username?: Nullable<string>,
  expiresInSeconds: number = DEV_ACCESS_TOKEN_EXPIRY_SECONDS,
): string => {
  const resolvedUsername = resolveDevUsername(username);
  const iat = Math.floor(Date.now() / 1000);

  return signDevJwt(secret, {
    // Like Cognito: sub carries the userId, username/email carry the login
    sub: createDevUserId(userDirectory, resolvedUsername),
    username: resolvedUsername,
    email: resolvedUsername,
    iat,
    exp: iat + expiresInSeconds,
  });
};

export const createDevAuthResponse = (secret: string, userDirectory: DevUserDirectory, username?: Nullable<string>): AuthenticateUserResponse => {
  const authenticationInfo: AuthenticationInfo = {
    accessToken: createDevJwt(secret, userDirectory, username),
    idToken: createDevJwt(secret, userDirectory, username),
    refreshToken: createDevJwt(secret, userDirectory, username, DEV_REFRESH_TOKEN_EXPIRY_SECONDS),
    expirationDurationInSeconds: DEV_ACCESS_TOKEN_EXPIRY_SECONDS,
    expiresAt: getQpqIsoDateTimeFromDate(new Date(Date.now() + DEV_ACCESS_TOKEN_EXPIRY_SECONDS * 1000)),
    tokenType: 'Bearer',
  };

  return {
    challenge: AuthenticateUserChallenge.NONE,
    authenticationInfo,
  };
};

import {
  AuthenticateUserChallenge,
  AuthenticateUserResponse,
  AuthenticationInfo,
  generateUuidV5,
  getQpqIsoDateTimeFromDate,
  QPQConfig,
  qpqCoreUtils,
  UuidNamespace,
} from 'quidproquo-core';

/**
 * Dev server auth helpers.
 *
 * The dev server has no real user directory ~ any username / password combination
 * is accepted and we mint an unsigned JWT for it. The token is a structurally
 * valid JWT so decodeAccessTokenForDev (and anything else that base64-decodes
 * the payload) works, but it carries no real signature.
 *
 * This is ONLY safe for development.
 */

export const DEV_USER_EMAIL = 'devuser@example.com';

const DEV_ACCESS_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;
const DEV_REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

export const resolveDevUsername = (username?: string | null): string => username || DEV_USER_EMAIL;

// The identity of a user directory once cross-module ownership is applied. Two
// services declaring the same directory name resolve to different identities;
// a directory referenced via `owner` resolves to the owning service's identity.
export interface DevUserDirectory {
  serviceName: string;
  directoryName: string;
}

// Mirrors the AWS runtime's user pool resolution (getCFExportNameUserPoolIdFromConfig):
// the owner module redirects to the owning service, resourceNameOverride renames the directory.
export const resolveDevUserDirectory = (userDirectoryName: string, qpqConfig: QPQConfig): DevUserDirectory => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(userDirectoryName, qpqConfig);

  return {
    serviceName: userDirectoryConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
    directoryName: userDirectoryConfig.owner?.resourceNameOverride || userDirectoryName,
  };
};

// Fixed namespace so userIds stay stable across dev server restarts.
const devUserIdNamespace = generateUuidV5('quidproquo-dev-server/user-id', UuidNamespace.url);

// Derives a deterministic userId from the directory identity and the login, so the
// same email is always the same user in dev ~ and, like Cognito user pools, the same
// email in two different directories is two different users. Emails are compared
// case-insensitively, hence the lowercase.
export const createDevUserId = (userDirectory: DevUserDirectory, username?: string | null): string => {
  const resolvedUsername = resolveDevUsername(username);

  return generateUuidV5(`${userDirectory.serviceName}/${userDirectory.directoryName}/${resolvedUsername.trim().toLowerCase()}`, devUserIdNamespace);
};

export const createDevJwt = (
  userDirectory: DevUserDirectory,
  username?: string | null,
  expiresInSeconds: number = DEV_ACCESS_TOKEN_EXPIRY_SECONDS,
): string => {
  const resolvedUsername = resolveDevUsername(username);
  const iat = Math.floor(Date.now() / 1000);

  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    // Like Cognito: sub carries the userId, username/email carry the login
    sub: createDevUserId(userDirectory, resolvedUsername),
    username: resolvedUsername,
    email: resolvedUsername,
    iat,
    exp: iat + expiresInSeconds,
  };

  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.dev-signature`;
};

export const createDevAuthResponse = (userDirectory: DevUserDirectory, username?: string | null): AuthenticateUserResponse => {
  const authenticationInfo: AuthenticationInfo = {
    accessToken: createDevJwt(userDirectory, username),
    idToken: createDevJwt(userDirectory, username),
    refreshToken: createDevJwt(userDirectory, username, DEV_REFRESH_TOKEN_EXPIRY_SECONDS),
    expirationDurationInSeconds: DEV_ACCESS_TOKEN_EXPIRY_SECONDS,
    expiresAt: getQpqIsoDateTimeFromDate(new Date(Date.now() + DEV_ACCESS_TOKEN_EXPIRY_SECONDS * 1000)),
    tokenType: 'Bearer',
  };

  return {
    challenge: AuthenticateUserChallenge.NONE,
    authenticationInfo,
  };
};

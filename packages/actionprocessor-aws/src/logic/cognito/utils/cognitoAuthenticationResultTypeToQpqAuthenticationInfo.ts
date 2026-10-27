import { AuthenticationInfo, getQpqIsoDateTimeFromDate } from 'quidproquo-core';

import { AuthenticationResultType } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Maps a Cognito AuthenticationResult onto qpq AuthenticationInfo, deriving the
 * absolute expiresAt from the request issue time plus Cognito's relative ExpiresIn.
 */
export const cognitoAuthenticationResultTypeToQpqAuthenticationInfo = (
  authResult: AuthenticationResultType,
  issueDateTime: string,
): AuthenticationInfo => {
  const expiryDate = new Date(issueDateTime);
  expiryDate.setSeconds(expiryDate.getSeconds() + (authResult.ExpiresIn || 0));

  return {
    accessToken: authResult.AccessToken,
    idToken: authResult.IdToken,
    refreshToken: authResult.RefreshToken,
    tokenType: authResult.TokenType,

    expirationDurationInSeconds: authResult.ExpiresIn,
    expiresAt: getQpqIsoDateTimeFromDate(expiryDate),
  };
};

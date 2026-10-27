import { AuthenticateUserResponse } from 'quidproquo-core';

import { AdminInitiateAuthResponse } from '@aws-sdk/client-cognito-identity-provider';

import { cognitoAuthenticationResultTypeToQpqAuthenticationInfo } from './cognitoAuthenticationResultTypeToQpqAuthenticationInfo';
import { cognitoChallengeNameTypeToQpqAuthenticateUserChallenge } from './cognitoChallengeNameTypeToQpqAuthenticateUserChallenge';

/**
 * Maps a Cognito InitiateAuth/RespondToAuthChallenge response onto the qpq
 * AuthenticateUserResponse: pending-challenge state plus, once Cognito issues
 * tokens, the authentication info with expiry anchored to issueDateTime.
 */
export const cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo = (
  authResponse: AdminInitiateAuthResponse,
  issueDateTime: string,
): AuthenticateUserResponse => {
  const res: AuthenticateUserResponse = {
    session: authResponse.Session,
    challenge: cognitoChallengeNameTypeToQpqAuthenticateUserChallenge(authResponse.ChallengeName),
    challengeParameters: authResponse.ChallengeParameters,
  };

  if (authResponse.AuthenticationResult) {
    res.authenticationInfo = cognitoAuthenticationResultTypeToQpqAuthenticationInfo(authResponse.AuthenticationResult, issueDateTime);
  }

  return res;
};

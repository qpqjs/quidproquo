import { AuthenticateUserResponse } from 'quidproquo-core';

import {
  ChallengeNameType,
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { calculateSecretHash } from './utils/calculateSecretHash';
import { cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo } from './utils/cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo';
import { getUserPoolClientSecret } from './getUserPoolClientSecret';

/**
 * Answers a pending Cognito auth challenge (new password, TOTP code, custom
 * challenge, ...) using the session from the previous auth step. Returns either
 * issued tokens or the next challenge.
 */
export const respondToAuthChallenge = async (
  userPoolId: string,
  clientId: string,
  region: string,
  username: string,
  session: string,
  challengeNameType: ChallengeNameType,
  attributes: Record<string, string>,
): Promise<AuthenticateUserResponse> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const clientSecret = await getUserPoolClientSecret(userPoolId, clientId, region);
  const secretHash = calculateSecretHash(username, clientId, clientSecret);

  const params: RespondToAuthChallengeCommandInput = {
    ChallengeName: challengeNameType,
    ClientId: clientId,
    Session: session,
    ChallengeResponses: {
      USERNAME: username,
      SECRET_HASH: secretHash,

      ...attributes,
    },
  };

  // Token expiry is computed relative to this; captured before the call so the
  // derived expiresAt errs early rather than late.
  const issueDateTime = new Date().toISOString();
  const response = await cognitoClient.send(new RespondToAuthChallengeCommand(params));

  return cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo(response, issueDateTime);
};

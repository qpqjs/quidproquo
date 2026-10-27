import { AuthenticateUserResponse } from 'quidproquo-core';

import {
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandInput,
  AuthFlowType,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { calculateSecretHash } from './utils/calculateSecretHash';
import { cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo } from './utils/cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo';
import { getUserPoolClientSecret } from './getUserPoolClientSecret';

// TODO: retry for TooManyRequestsException

/**
 * Starts a Cognito auth flow (password auth, or CUSTOM_AUTH when isCustom) and
 * returns the qpq response: either issued tokens or a pending challenge.
 */
export const authenticateUser = async (
  userPoolId: string,
  clientId: string,
  region: string,
  isCustom: boolean,
  username: string,
  password?: string,
): Promise<AuthenticateUserResponse> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const clientSecret = await getUserPoolClientSecret(userPoolId, clientId, region);
  const secretHash = calculateSecretHash(username, clientId, clientSecret);

  // Token expiry is computed relative to this; captured before the call so the
  // derived expiresAt errs early rather than late.
  const issueDateTime = new Date().toISOString();

  const params: AdminInitiateAuthCommandInput = {
    AuthFlow: isCustom ? AuthFlowType.CUSTOM_AUTH : AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
    UserPoolId: userPoolId,
    ClientId: clientId,

    AuthParameters: {
      USERNAME: username,
      SECRET_HASH: secretHash,
    },
  };

  if (password) {
    params.AuthParameters!.PASSWORD = password;
  }

  const response = await cognitoClient.send(new AdminInitiateAuthCommand(params));

  return cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo(response, issueDateTime);
};

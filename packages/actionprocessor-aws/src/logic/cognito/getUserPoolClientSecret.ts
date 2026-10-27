import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  DescribeUserPoolClientCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

// DescribeUserPoolClient succeeds even when the app client has no secret, so a
// missing secret is a hand-thrown, discriminable configuration error.
export class ClientSecretNotFoundError extends Error {
  readonly code = 'CLIENT_SECRET_NOT_FOUND';

  constructor() {
    super('Can not find client secret for Cognito user pool client');
    this.name = 'ClientSecretNotFoundError';
  }
}

/**
 * Fetches the app client's secret (needed to compute the SECRET_HASH for auth
 * flows). Throws ClientSecretNotFoundError when the client has no secret.
 */
export const getUserPoolClientSecret = async (userPoolId: string, clientId: string, region: string): Promise<string> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: DescribeUserPoolClientCommandInput = {
    ClientId: clientId,
    UserPoolId: userPoolId,
  };

  const response = await cognitoClient.send(new DescribeUserPoolClientCommand(params));

  const clientSecret = response.UserPoolClient?.ClientSecret;
  if (!clientSecret) {
    throw new ClientSecretNotFoundError();
  }

  return clientSecret;
};

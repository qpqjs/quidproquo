import { UserAttributes } from 'quidproquo-core';

import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { getValidCognitoUserAttributes } from './utils/getValidCognitoUserAttributes';
import { getQpqAttributesFromCognitoUserAttributes } from './getQpqAttributesFromCognitoUserAttributes';

export const getUserAttributes = async (userPoolId: string, region: string, username: string): Promise<UserAttributes> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }),
  );

  return getQpqAttributesFromCognitoUserAttributes(getValidCognitoUserAttributes(response.UserAttributes));
};

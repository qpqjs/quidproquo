import { UserAttributes } from 'quidproquo-core';

import { AdminUpdateUserAttributesCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { getCognitoUserAttributesFromQpqUserAttributes } from './getCognitoUserAttributesFromQpqUserAttributes';

export const setUserAttributes = async (userPoolId: string, region: string, username: string, userAttributes: UserAttributes): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  // userId maps to the immutable sub attribute, so it must never be written back.
  const { userId, ...writeableUserAttributes } = userAttributes;

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: getCognitoUserAttributesFromQpqUserAttributes(writeableUserAttributes),
    }),
  );
};

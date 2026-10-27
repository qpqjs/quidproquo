import { UserAttributes } from 'quidproquo-core';

import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { buildCognitoUserFilter, InvalidCognitoFilterError } from './utils/buildCognitoUserFilter';
import { getValidCognitoUserAttributes } from './utils/getValidCognitoUserAttributes';
import { getQpqAttributesFromCognitoUserAttributes } from './getQpqAttributesFromCognitoUserAttributes';

// ListUsers returns an empty list rather than throwing for no match, so we throw
// our own error with a discriminable `code` for the processor's catch to map.
export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

// A sub that cannot be embedded in a Cognito filter cannot belong to any user,
// so unsafe input resolves to not-found instead of reaching Cognito.
const buildSubFilter = (sub: string): string => {
  try {
    return buildCognitoUserFilter('sub', sub);
  } catch (error) {
    if (error instanceof InvalidCognitoFilterError) {
      throw new UserNotFoundError();
    }
    throw error;
  }
};

export const getUserAttributesBySub = async (userPoolId: string, region: string, sub: string): Promise<UserAttributes> => {
  const filter = buildSubFilter(sub);

  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: filter,
    }),
  );

  const [user] = response?.Users || [];
  if (!user) {
    throw new UserNotFoundError();
  }

  return getQpqAttributesFromCognitoUserAttributes(getValidCognitoUserAttributes(user.Attributes));
};

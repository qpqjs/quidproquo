import { QpqPagedData, UserAttributes } from 'quidproquo-core';

import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { getQpqAttributesFromCognitoUserAttributes } from './getQpqAttributesFromCognitoUserAttributes';
import { getValidCognitoUserAttributes, pageKeyToPaginationToken, paginationTokenToPageKey } from './utils';

export const listPagedUsers = async (userPoolId: string, region: string, pageKey?: string): Promise<QpqPagedData<UserAttributes>> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      PaginationToken: pageKeyToPaginationToken(pageKey),
    }),
  );

  return {
    nextPageKey: paginationTokenToPageKey(response.PaginationToken),
    items: (response.Users || []).map((user) => getQpqAttributesFromCognitoUserAttributes(getValidCognitoUserAttributes(user.Attributes))),
  };
};

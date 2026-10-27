import { QpqPagedData, UserAttributes } from 'quidproquo-core';

import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { getQpqAttributesFromCognitoUserAttributes } from './getQpqAttributesFromCognitoUserAttributes';
import { buildCognitoUserFilter, getValidCognitoUserAttributes, pageKeyToPaginationToken, paginationTokenToPageKey } from './utils';

/**
 * Lists users whose attribute exactly matches the given value.
 * Throws InvalidCognitoFilterError (code INVALID_COGNITO_FILTER) when the
 * attribute name or value cannot be embedded safely in a Cognito filter.
 */
export const listPagedUsersByAttribute = async (
  userPoolId: string,
  region: string,
  attributeName: string,
  attributeValue: string,
  limit?: number,
  pageKey?: string,
): Promise<QpqPagedData<UserAttributes>> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: limit,
      Filter: buildCognitoUserFilter(attributeName, attributeValue),
      PaginationToken: pageKeyToPaginationToken(pageKey),
    }),
  );

  return {
    nextPageKey: paginationTokenToPageKey(response.PaginationToken),
    items: (response.Users || []).map((user) => getQpqAttributesFromCognitoUserAttributes(getValidCognitoUserAttributes(user.Attributes))),
  };
};

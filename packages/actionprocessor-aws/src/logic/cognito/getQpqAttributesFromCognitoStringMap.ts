import { UserAttributes } from 'quidproquo-core';

import { getQpqAttributeObjectFromCognitoKeyValue } from './getQpqAttributeObjectFromCognitoKeyValue';

/**
 * Maps a Cognito name-to-value record (as delivered in lambda trigger events)
 * onto the qpq UserAttributes shape.
 */
export const getQpqAttributesFromCognitoStringMap = (cognitoUserAttributes: Record<string, string>): UserAttributes => {
  const userAttributes: UserAttributes = {};

  for (const [key, value] of Object.entries(cognitoUserAttributes)) {
    Object.assign(userAttributes, getQpqAttributeObjectFromCognitoKeyValue(key, value));
  }

  return userAttributes;
};

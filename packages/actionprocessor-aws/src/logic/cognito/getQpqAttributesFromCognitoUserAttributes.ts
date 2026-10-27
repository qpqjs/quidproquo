import { UserAttributes } from 'quidproquo-core';

import { CognitoUserAttribute } from './utils/CognitoUserAttribute';
import { getQpqAttributeObjectFromCognitoKeyValue } from './getQpqAttributeObjectFromCognitoKeyValue';

/** Maps a list of Cognito user attributes onto the qpq UserAttributes shape. */
export const getQpqAttributesFromCognitoUserAttributes = (cognitoUserAttributes: CognitoUserAttribute[]): UserAttributes => {
  const userAttributes: UserAttributes = {};

  for (const { Name, Value } of cognitoUserAttributes) {
    Object.assign(userAttributes, getQpqAttributeObjectFromCognitoKeyValue(Name, Value));
  }

  return userAttributes;
};

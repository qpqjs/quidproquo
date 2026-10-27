import { UserAttributes } from 'quidproquo-core';

import { cognitoAttributeMap } from './cognitoAttributeMap';

const reversedCognitoAttributeMap: Record<string, keyof UserAttributes> = Object.fromEntries(
  Object.entries(cognitoAttributeMap).map(([qpqKey, cognitoName]) => [cognitoName, qpqKey as keyof UserAttributes]),
);

/**
 * Maps a single Cognito attribute name/value onto a partial UserAttributes object.
 * Names with no qpq mapping (e.g. cognito:groups) produce an empty object, and
 * email_verified is coerced from Cognito's 'true'/'false' string to a boolean.
 */
export const getQpqAttributeObjectFromCognitoKeyValue = (key: string, value: string): UserAttributes => {
  const userAttributeKey = reversedCognitoAttributeMap[key];

  if (!userAttributeKey) {
    return {};
  }

  if (userAttributeKey === 'emailVerified') {
    return { emailVerified: value === 'true' };
  }

  return { [userAttributeKey]: value };
};

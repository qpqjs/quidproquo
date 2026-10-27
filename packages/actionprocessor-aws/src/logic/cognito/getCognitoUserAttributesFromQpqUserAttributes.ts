import { UserAttributes } from 'quidproquo-core';

import { CognitoUserAttribute } from './utils/CognitoUserAttribute';
import { cognitoAttributeMap } from './cognitoAttributeMap';

/**
 * Maps qpq UserAttributes onto Cognito Name/Value pairs. Keys with no Cognito
 * mapping (e.g. password on CreateUserRequest) and absent or empty values are
 * dropped; everything else is stringified (booleans become 'true'/'false').
 */
export const getCognitoUserAttributesFromQpqUserAttributes = (userAttributes: UserAttributes): CognitoUserAttribute[] => {
  return (Object.keys(userAttributes) as (keyof UserAttributes)[])
    .filter((key) => userAttributes[key] !== undefined && userAttributes[key] !== null)
    .map((key) => ({
      Name: cognitoAttributeMap[key],
      Value: `${userAttributes[key]}`,
    }))
    .filter((attribute): attribute is CognitoUserAttribute => !!attribute.Name && !!attribute.Value);
};

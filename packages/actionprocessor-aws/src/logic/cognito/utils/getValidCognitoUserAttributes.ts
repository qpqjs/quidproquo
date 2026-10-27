import { AttributeType } from '@aws-sdk/client-cognito-identity-provider';

import { CognitoUserAttribute } from './CognitoUserAttribute';

/**
 * Narrows the SDK's AttributeType[] (where Name and Value are both optional) down
 * to the attributes that actually carry a name and a value.
 */
export const getValidCognitoUserAttributes = (attributes: AttributeType[] | undefined): CognitoUserAttribute[] =>
  (attributes || []).filter((attribute): attribute is CognitoUserAttribute => !!attribute.Name && !!attribute.Value);

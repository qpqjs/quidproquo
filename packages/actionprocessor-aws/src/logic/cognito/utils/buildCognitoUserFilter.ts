// ListUsers filter strings are built by interpolation, so a value containing a
// quote or backslash could break out of the quoted literal and alter the filter.
// Cognito defines no escaping for these, so unsafe input is rejected outright.
export class InvalidCognitoFilterError extends Error {
  readonly code = 'INVALID_COGNITO_FILTER';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidCognitoFilterError';
  }
}

// Cognito filterable attribute names: standard attributes plus prefixed ones
// like cognito:user_status.
const validAttributeName = /^[a-zA-Z][a-zA-Z0-9_:]*$/;

/**
 * Builds a Cognito ListUsers exact-match filter (`name = "value"`), rejecting
 * attribute names and values that cannot be embedded safely.
 * Throws InvalidCognitoFilterError (code INVALID_COGNITO_FILTER) on unsafe input.
 */
export const buildCognitoUserFilter = (attributeName: string, attributeValue: string): string => {
  if (!validAttributeName.test(attributeName)) {
    throw new InvalidCognitoFilterError(`Invalid Cognito filter attribute name: ${attributeName}`);
  }

  // The value is deliberately not echoed into the message: it can be user input.
  if (attributeValue.includes('"') || attributeValue.includes('\\')) {
    throw new InvalidCognitoFilterError('Cognito filter values cannot contain quotes or backslashes');
  }

  return `${attributeName} = "${attributeValue}"`;
};

import { describe, expect, it } from 'vitest';

import { getCognitoUserAttributesFromQpqUserAttributes } from './getCognitoUserAttributesFromQpqUserAttributes';

describe('getCognitoUserAttributesFromQpqUserAttributes', () => {
  it('maps qpq attribute keys to their cognito names', () => {
    expect(getCognitoUserAttributesFromQpqUserAttributes({ email: 'a@b.com', givenName: 'Ada' })).toEqual([
      { Name: 'email', Value: 'a@b.com' },
      { Name: 'given_name', Value: 'Ada' },
    ]);
  });

  it('stringifies values, including booleans', () => {
    expect(getCognitoUserAttributesFromQpqUserAttributes({ emailVerified: true })).toEqual([{ Name: 'email_verified', Value: 'true' }]);
  });

  it('drops keys whose value is undefined instead of writing the string "undefined"', () => {
    expect(getCognitoUserAttributesFromQpqUserAttributes({ email: 'a@b.com', givenName: undefined })).toEqual([{ Name: 'email', Value: 'a@b.com' }]);
  });
});

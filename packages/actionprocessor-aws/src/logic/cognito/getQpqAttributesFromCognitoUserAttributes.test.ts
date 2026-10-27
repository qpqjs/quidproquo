import { describe, expect, it } from 'vitest';

import { getQpqAttributesFromCognitoUserAttributes } from './getQpqAttributesFromCognitoUserAttributes';

describe('getQpqAttributesFromCognitoUserAttributes', () => {
  it('reverse maps cognito names to qpq keys', () => {
    expect(
      getQpqAttributesFromCognitoUserAttributes([
        { Name: 'email', Value: 'a@b.com' },
        { Name: 'given_name', Value: 'Ada' },
      ]),
    ).toEqual({ email: 'a@b.com', givenName: 'Ada' });
  });

  it('coerces email_verified to a boolean', () => {
    expect(getQpqAttributesFromCognitoUserAttributes([{ Name: 'email_verified', Value: 'true' }])).toEqual({ emailVerified: true });
    expect(getQpqAttributesFromCognitoUserAttributes([{ Name: 'email_verified', Value: 'false' }])).toEqual({ emailVerified: false });
  });

  it('ignores attributes with no matching mapping', () => {
    expect(getQpqAttributesFromCognitoUserAttributes([{ Name: 'cognito:groups', Value: 'admin' }])).toEqual({});
  });
});

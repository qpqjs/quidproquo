import { describe, expect, it } from 'vitest';

import { getQpqAttributesFromCognitoStringMap } from './getQpqAttributesFromCognitoStringMap';

describe('getQpqAttributesFromCognitoStringMap', () => {
  it('maps a record of cognito names to qpq attributes', () => {
    expect(getQpqAttributesFromCognitoStringMap({ sub: 'abc', email_verified: 'false' })).toEqual({
      userId: 'abc',
      emailVerified: false,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { getValidCognitoUserAttributes } from './getValidCognitoUserAttributes';

describe('getValidCognitoUserAttributes', () => {
  it('keeps only attributes with both a name and a value', () => {
    expect(getValidCognitoUserAttributes([{ Name: 'email', Value: 'a@b.com' }, { Name: 'given_name' }, { Value: 'orphan' }, {}])).toEqual([
      { Name: 'email', Value: 'a@b.com' },
    ]);
  });

  it('returns an empty list for undefined input', () => {
    expect(getValidCognitoUserAttributes(undefined)).toEqual([]);
  });
});

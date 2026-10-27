import { describe, expect, it } from 'vitest';

import { buildCognitoUserFilter, InvalidCognitoFilterError } from './buildCognitoUserFilter';

describe('buildCognitoUserFilter', () => {
  it('builds an exact-match filter', () => {
    expect(buildCognitoUserFilter('preferred_username', 'alice')).toBe('preferred_username = "alice"');
  });

  it('allows prefixed attribute names', () => {
    expect(buildCognitoUserFilter('cognito:user_status', 'CONFIRMED')).toBe('cognito:user_status = "CONFIRMED"');
  });

  it.each([['email = "x" or sub'], ['name with spaces'], [''], ['"email"']])('rejects the attribute name %j', (attributeName: string) => {
    expect(() => buildCognitoUserFilter(attributeName, 'value')).toThrow(InvalidCognitoFilterError);
  });

  it.each([['break" out'], ['back\\slash']])('rejects the value %j so it cannot escape the quoted literal', (value: string) => {
    expect(() => buildCognitoUserFilter('email', value)).toThrow(InvalidCognitoFilterError);
  });

  it('throws with a discriminable code for processor error maps', () => {
    try {
      buildCognitoUserFilter('email', '"');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as InvalidCognitoFilterError).code).toBe('INVALID_COGNITO_FILTER');
    }
  });
});

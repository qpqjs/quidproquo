import { describe, expect, it } from 'vitest';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from './constants';

describe('AUTH_USER_DIRECTORY_GLOBAL_KEY', () => {
  it('is the auth user directory global key', () => {
    expect(AUTH_USER_DIRECTORY_GLOBAL_KEY).toBe('qpq-auth-user-directory');
  });
});

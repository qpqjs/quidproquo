import { describe, expect, it } from 'vitest';

import { AuthState } from './authTypes';
import { isLoggedOn } from './isLoggedOn';

const buildState = (accessToken?: string, expiresAt?: string): AuthState => ({
  username: '',
  password: '',
  authenticateUserResponse: {
    authenticationInfo: {
      accessToken: accessToken as string,
      expiresAt: expiresAt as string,
    },
  } as AuthState['authenticateUserResponse'],
});

describe('isLoggedOn', () => {
  it('returns true when a valid token has not expired', () => {
    const future = new Date(Date.now() + 60_000).toISOString();

    expect(isLoggedOn(buildState('token', future))).toBe(true);
  });

  it('returns false when the token has expired', () => {
    const past = new Date(Date.now() - 60_000).toISOString();

    expect(isLoggedOn(buildState('token', past))).toBe(false);
  });

  it('returns false when there is no access token', () => {
    const future = new Date(Date.now() + 60_000).toISOString();

    expect(isLoggedOn(buildState(undefined, future))).toBe(false);
  });

  it('returns false when the expiry is not a valid date', () => {
    expect(isLoggedOn(buildState('token', 'not-a-date'))).toBe(false);
  });

  it('returns false when there is no authenticate response', () => {
    expect(isLoggedOn({ username: '', password: '' })).toBe(false);
  });
});

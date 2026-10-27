import { AuthenticateUserChallenge, AuthenticateUserResponse, runStory } from 'quidproquo-core';

import { beforeEach, describe, expect, it } from 'vitest';

import { askSaveAuthToken } from './askSaveAuthToken';
import { clearInMemoryAuthToken, getInMemoryAuthToken } from './inMemoryAuthTokenStore';

describe('askSaveAuthToken', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('stores the new auth token in memory', () => {
    const newResponse = {
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'new' },
    } as unknown as AuthenticateUserResponse;

    runStory(askSaveAuthToken(newResponse), {});

    expect(getInMemoryAuthToken()).toEqual(newResponse);
  });

  it('replaces any previously stored token', () => {
    const oldResponse = {
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'old', refreshToken: 'old-refresh' },
    } as unknown as AuthenticateUserResponse;
    const newResponse = {
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'new' },
    } as unknown as AuthenticateUserResponse;

    runStory(askSaveAuthToken(oldResponse), {});
    runStory(askSaveAuthToken(newResponse), {});

    expect(getInMemoryAuthToken()).toEqual(newResponse);
  });
});

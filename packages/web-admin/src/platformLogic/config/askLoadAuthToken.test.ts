import { AuthenticateUserChallenge, AuthenticateUserResponse, runStory } from 'quidproquo-core';

import { beforeEach, describe, expect, it } from 'vitest';

import { askLoadAuthToken } from './askLoadAuthToken';
import { clearInMemoryAuthToken, setInMemoryAuthToken } from './inMemoryAuthTokenStore';

describe('askLoadAuthToken', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('returns the in-memory auth token', () => {
    const stored = {
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'tok' },
    } as unknown as AuthenticateUserResponse;
    setInMemoryAuthToken(stored);

    const result = runStory(askLoadAuthToken(), {});

    expect(result).toEqual(stored);
  });

  it('returns a NONE challenge when no token is stored', () => {
    const result = runStory(askLoadAuthToken(), {});

    expect(result).toEqual({ challenge: AuthenticateUserChallenge.NONE });
  });
});

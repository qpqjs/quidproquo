import { AuthenticateUserChallenge, AuthenticateUserResponse, runStory, StateActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it } from 'vitest';

import { clearInMemoryAuthToken, getInMemoryAuthToken, setInMemoryAuthToken } from '../../../platformLogic';
import { AuthEffect } from '../authTypes';
import { askAuthLogout } from './askAuthLogout';

describe('askAuthLogout', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('clears the stored auth token and resets the auth state', () => {
    setInMemoryAuthToken({
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'tok', refreshToken: 'ref' },
    } as unknown as AuthenticateUserResponse);

    const dispatched: { type: string; payload: unknown }[] = [];

    runStory(askAuthLogout(), {
      [StateActionType.Dispatch]: (action: { payload: { action: { type: string; payload: unknown } } }) => {
        dispatched.push(action.payload.action);
      },
    });

    expect(getInMemoryAuthToken()).toEqual({ challenge: AuthenticateUserChallenge.NONE });

    expect(dispatched).toContainEqual({ type: AuthEffect.SetPassword, payload: '' });
    expect(dispatched).toContainEqual({ type: AuthEffect.SetAuthInfo, payload: { challenge: AuthenticateUserChallenge.NONE } });
  });
});

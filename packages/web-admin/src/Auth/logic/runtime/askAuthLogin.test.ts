import {
  AuthenticateUserChallenge,
  ContextActionType,
  DateActionType,
  GuidActionType,
  NetworkActionType,
  runStory,
  StateActionType,
} from '@qpqjs/core';

import { beforeEach, describe, expect, it } from 'vitest';

import { clearInMemoryAuthToken, getInMemoryAuthToken } from '../../../platformLogic';
import { AuthEffect } from '../authTypes';
import { askAuthLogin } from './askAuthLogin';

const baseMocks = (dispatched: string[], networkResponse: unknown) => ({
  [StateActionType.Read]: { username: 'joe', password: 'secret' },
  [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: networkResponse,
  [StateActionType.Dispatch]: (action: { payload: { action: { type: string } } }) => {
    dispatched.push(action.payload.action.type);
  },
});

describe('askAuthLogin', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('saves the token and sets auth info on a successful login', () => {
    const dispatched: string[] = [];
    const loginResponse = { challenge: AuthenticateUserChallenge.NONE, authenticationInfo: { accessToken: 'tok' } };

    runStory(askAuthLogin(), baseMocks(dispatched, { status: 200, data: loginResponse }));

    expect(getInMemoryAuthToken()).toEqual(loginResponse);
    expect(dispatched).toContain(AuthEffect.SetAuthInfo);
  });

  // The typed password has done its job once the server answers; keeping it in state would
  // expose it to every component (and devtools) for the whole session.
  it('clears the password from state once the login request has been answered', () => {
    const dispatched: string[] = [];
    const payloads: unknown[] = [];
    const loginResponse = { challenge: AuthenticateUserChallenge.NONE, authenticationInfo: { accessToken: 'tok' } };
    const mocks = baseMocks(dispatched, { status: 200, data: loginResponse });
    mocks[StateActionType.Dispatch] = (action: { payload: { action: { type: string; payload?: unknown } } }) => {
      dispatched.push(action.payload.action.type);
      payloads.push(action.payload.action.payload);
    };

    runStory(askAuthLogin(), mocks);

    const setPasswordIndex = dispatched.indexOf(AuthEffect.SetPassword);
    expect(setPasswordIndex).toBeGreaterThanOrEqual(0);
    expect(payloads[setPasswordIndex]).toBe('');
  });

  it('does nothing when the login request fails', () => {
    const dispatched: string[] = [];

    runStory(askAuthLogin(), baseMocks(dispatched, { status: 401, data: {} }));

    expect(getInMemoryAuthToken()).toEqual({ challenge: AuthenticateUserChallenge.NONE });
    expect(dispatched).not.toContain(AuthEffect.SetAuthInfo);
  });
});

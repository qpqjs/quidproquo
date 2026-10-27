import {
  AuthenticateUserChallenge,
  ContextActionType,
  DateActionType,
  GuidActionType,
  NetworkActionType,
  runStory,
  StateActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearInMemoryAuthToken, getInMemoryAuthToken } from '../../../../platformLogic';
import { AuthEffect } from '../../../logic/authTypes';
import { askAuthChallengeSendPasswords } from './askAuthChallengeSendPasswords';

const baseMocks = (dispatched: string[], networkRequest: unknown) => ({
  [StateActionType.Read]: { passwordA: 'newpass', passwordB: 'newpass' },
  [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: networkRequest,
  [StateActionType.Dispatch]: (action: { payload: { action: { type: string } } }) => {
    dispatched.push(action.payload.action.type);
  },
});

describe('askAuthChallengeSendPasswords', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('posts the new password and persists the resulting token', () => {
    const dispatched: string[] = [];
    const networkRequest = vi.fn(() => ({ status: 200, data: { challenge: 'NONE' } }));

    runStory(askAuthChallengeSendPasswords('NEW_PASSWORD_REQUIRED', 'sess', 'joe@x.com'), baseMocks(dispatched, networkRequest));

    const networkAction = networkRequest.mock.calls[0][0] as { payload: { url: string; body: { newPassword: string } } };
    expect(networkAction.payload.url).toBe('/challenge');
    expect(networkAction.payload.body.newPassword).toBe('newpass');
    expect(getInMemoryAuthToken()).toEqual({ challenge: 'NONE' });
    expect(dispatched).toContain(AuthEffect.SetAuthInfo);
  });

  it('returns without saving when the challenge request fails', () => {
    const dispatched: string[] = [];

    runStory(askAuthChallengeSendPasswords('NEW_PASSWORD_REQUIRED', 'sess', 'joe@x.com'), baseMocks(dispatched, { status: 400, data: {} }));

    expect(getInMemoryAuthToken()).toEqual({ challenge: AuthenticateUserChallenge.NONE });
    expect(dispatched).not.toContain(AuthEffect.SetAuthInfo);
  });
});

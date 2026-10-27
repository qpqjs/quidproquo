import { AuthenticateUserResponse, captureRequester, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askAuthUISetAuthInfo, askAuthUISetPassword, askAuthUISetUsername } from './authActionCreator';
import { AuthEffect } from './authTypes';

describe('askAuthUISetUsername', () => {
  it('dispatches a SetUsername effect', () => {
    const { action } = captureRequester(askAuthUISetUsername('joe'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetUsername, payload: 'joe' } },
    });
  });
});

describe('askAuthUISetPassword', () => {
  it('dispatches a SetPassword effect', () => {
    const { action } = captureRequester(askAuthUISetPassword('secret'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetPassword, payload: 'secret' } },
    });
  });
});

describe('askAuthUISetAuthInfo', () => {
  it('dispatches a SetAuthInfo effect carrying the response', () => {
    const authInfo = { challenge: undefined } as unknown as AuthenticateUserResponse;
    const { action } = captureRequester(askAuthUISetAuthInfo(authInfo));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetAuthInfo, payload: authInfo } },
    });
  });
});

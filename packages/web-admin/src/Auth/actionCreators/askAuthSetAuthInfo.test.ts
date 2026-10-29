import { AuthenticateUserResponse, StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthEffect } from '../effects/AuthEffect';
import { askAuthSetAuthInfo } from './askAuthSetAuthInfo';

describe('askAuthSetAuthInfo', () => {
  it('dispatches a SetAuthInfo effect carrying the response', () => {
    const authInfo = { challenge: undefined } as unknown as AuthenticateUserResponse;
    const { action } = captureRequester(askAuthSetAuthInfo(authInfo));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetAuthInfo, payload: authInfo } },
    });
  });
});

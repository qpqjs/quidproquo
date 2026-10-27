import { Action, AuthenticateUserChallenge, AuthenticateUserResponse, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askRespondToAuthChallenge } from './askRespondToAuthChallenge';

describe('askRespondToAuthChallenge', () => {
  it('responds to the new-password challenge against the admin directory', () => {
    const authResponse = { challenge: AuthenticateUserChallenge.NONE } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askRespondToAuthChallenge('a@b.com', AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, 'sess', 'new-pw'), {
      [UserDirectoryActionType.RespondToAuthChallenge]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({
      userDirectoryName: 'qpq-admin',
      authChallenge: {
        username: 'a@b.com',
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        session: 'sess',
        newPassword: 'new-pw',
      },
    });
    expect(result).toBe(authResponse);
  });
});

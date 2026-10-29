import { Action, AuthenticateUserChallenge, AuthenticateUserResponse, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthRespondToChallenge } from './askAuthRespondToChallenge';

describe('askAuthRespondToChallenge', () => {
  it('responds to the new-password challenge against the admin directory', () => {
    const authResponse = { challenge: AuthenticateUserChallenge.NONE } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askAuthRespondToChallenge('a@b.com', AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, 'sess', 'new-pw'), {
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

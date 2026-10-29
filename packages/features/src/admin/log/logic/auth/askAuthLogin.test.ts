import { Action, AuthenticateUserResponse, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthLogin } from './askAuthLogin';

describe('askAuthLogin', () => {
  it('authenticates against the admin directory and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'tok' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askAuthLogin('a@b.com', 'pw'), {
      [UserDirectoryActionType.AuthenticateUser]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({
      userDirectoryName: 'qpq-admin',
      authenticateUserRequest: { isCustom: false, email: 'a@b.com', password: 'pw' },
    });
    expect(result).toBe(authResponse);
  });
});

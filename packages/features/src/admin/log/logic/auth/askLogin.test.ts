import { Action, AuthenticateUserResponse, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askLogin } from './askLogin';

describe('askLogin', () => {
  it('authenticates against the admin directory and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'tok' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askLogin('a@b.com', 'pw'), {
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

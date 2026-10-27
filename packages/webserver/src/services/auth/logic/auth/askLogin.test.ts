import { Action, AuthenticateUserResponse, ConfigActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askLogin } from './askLogin';

describe('askLogin', () => {
  it('authenticates against the resolved directory and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'tok' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askLogin('a@b.com', 'pw'), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.AuthenticateUser]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({
      userDirectoryName: 'my-directory',
      authenticateUserRequest: { isCustom: false, email: 'a@b.com', password: 'pw' },
    });
    expect(result).toBe(authResponse);
  });
});

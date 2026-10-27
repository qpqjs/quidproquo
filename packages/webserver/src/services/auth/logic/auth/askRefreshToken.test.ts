import { Action, AuthenticateUserResponse, ConfigActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askRefreshToken } from './askRefreshToken';

describe('askRefreshToken', () => {
  it('refreshes against the resolved directory and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'fresh' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askRefreshToken('refresh-tok'), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.RefreshToken]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'my-directory', refreshToken: 'refresh-tok' });
    expect(result).toBe(authResponse);
  });
});

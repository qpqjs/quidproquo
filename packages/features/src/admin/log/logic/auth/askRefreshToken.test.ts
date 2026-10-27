import { Action, AuthenticateUserResponse, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askRefreshToken } from './askRefreshToken';

describe('askRefreshToken', () => {
  it('refreshes the admin token and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'fresh' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askRefreshToken('refresh-tok'), {
      [UserDirectoryActionType.RefreshToken]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'qpq-admin', refreshToken: 'refresh-tok' });
    expect(result).toBe(authResponse);
  });
});

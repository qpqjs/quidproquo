import { Action, AuthenticateUserResponse, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthRefreshToken } from './askAuthRefreshToken';

describe('askAuthRefreshToken', () => {
  it('refreshes the admin token and returns the response', () => {
    const authResponse = { authenticationInfo: { accessToken: 'fresh' } } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askAuthRefreshToken('refresh-tok'), {
      [UserDirectoryActionType.RefreshToken]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'qpq-admin', refreshToken: 'refresh-tok' });
    expect(result).toBe(authResponse);
  });
});

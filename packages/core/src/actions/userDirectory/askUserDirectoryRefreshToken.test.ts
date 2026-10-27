import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryRefreshToken } from './askUserDirectoryRefreshToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryRefreshToken', () => {
  it('yields a RefreshToken action carrying the directory and refresh token', () => {
    const { action } = captureRequester(askUserDirectoryRefreshToken('pool', 'refresh'));

    expect(action).toEqual({
      type: UserDirectoryActionType.RefreshToken,
      payload: { userDirectoryName: 'pool', refreshToken: 'refresh' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryRefreshToken('pool', 'refresh'), { accessToken: 'token' });

    expect(returned).toEqual({ accessToken: 'token' });
  });
});

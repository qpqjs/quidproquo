import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryDecodeAccessToken } from './askUserDirectoryDecodeAccessToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryDecodeAccessToken', () => {
  it('yields a DecodeAccessToken action carrying the token and expiration flag', () => {
    const { action } = captureRequester(askUserDirectoryDecodeAccessToken('pool', true, 'token'));

    expect(action).toEqual({
      type: UserDirectoryActionType.DecodeAccessToken,
      payload: { userDirectoryName: 'pool', accessToken: 'token', ignoreExpiration: true },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryDecodeAccessToken('pool', false, 'token'), { sub: 'user-1' });

    expect(returned).toEqual({ sub: 'user-1' });
  });
});

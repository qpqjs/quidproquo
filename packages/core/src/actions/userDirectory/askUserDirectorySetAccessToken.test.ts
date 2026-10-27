import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectorySetAccessToken } from './askUserDirectorySetAccessToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectorySetAccessToken', () => {
  it('yields a SetAccessToken action carrying the token and directory', () => {
    const { action } = captureRequester(askUserDirectorySetAccessToken('pool', 'token'));

    expect(action).toEqual({
      type: UserDirectoryActionType.SetAccessToken,
      payload: { accessToken: 'token', userDirectoryName: 'pool' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectorySetAccessToken('pool', 'token'), undefined);

    expect(returned).toBeUndefined();
  });
});

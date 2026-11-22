import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { DecodedAccessToken } from '../../types/StorySession';
import { askUserDirectorySetDecodedAccessToken } from './askUserDirectorySetDecodedAccessToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

const decodedAccessToken: DecodedAccessToken = {
  userId: 'user-1',
  username: 'Ada',
  exp: 4102444800,
  userDirectory: '',
  wasValid: true,
};

describe('askUserDirectorySetDecodedAccessToken', () => {
  it('yields a SetDecodedAccessToken action carrying the identity', () => {
    const { action } = captureRequester(askUserDirectorySetDecodedAccessToken(decodedAccessToken));

    expect(action).toEqual({
      type: UserDirectoryActionType.SetDecodedAccessToken,
      payload: { decodedAccessToken },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectorySetDecodedAccessToken(decodedAccessToken), undefined);

    expect(returned).toBeUndefined();
  });
});

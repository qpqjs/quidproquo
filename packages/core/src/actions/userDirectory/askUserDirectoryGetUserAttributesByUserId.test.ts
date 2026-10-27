import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryGetUserAttributesByUserId } from './askUserDirectoryGetUserAttributesByUserId';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryGetUserAttributesByUserId', () => {
  it('yields a GetUserAttributesByUserId action carrying the directory and user id', () => {
    const { action } = captureRequester(askUserDirectoryGetUserAttributesByUserId('pool', 'user-1'));

    expect(action).toEqual({
      type: UserDirectoryActionType.GetUserAttributesByUserId,
      payload: { userDirectoryName: 'pool', userId: 'user-1' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryGetUserAttributesByUserId('pool', 'user-1'), { email: 'a@b.com' });

    expect(returned).toEqual({ email: 'a@b.com' });
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryGetUserAttributes } from './askUserDirectoryGetUserAttributes';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryGetUserAttributes', () => {
  it('yields a GetUserAttributes action carrying the directory and username', () => {
    const { action } = captureRequester(askUserDirectoryGetUserAttributes('pool', 'user'));

    expect(action).toEqual({
      type: UserDirectoryActionType.GetUserAttributes,
      payload: { userDirectoryName: 'pool', username: 'user' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryGetUserAttributes('pool', 'user'), { email: 'a@b.com' });

    expect(returned).toEqual({ email: 'a@b.com' });
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectorySetUserAttributes } from './askUserDirectorySetUserAttributes';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectorySetUserAttributes', () => {
  const userAttributes = { email: 'a@b.com', givenName: 'Ada' };

  it('yields a SetUserAttributes action carrying the directory, username and attributes', () => {
    const { action } = captureRequester(askUserDirectorySetUserAttributes('pool', 'user', userAttributes));

    expect(action).toEqual({
      type: UserDirectoryActionType.SetUserAttributes,
      payload: { userDirectoryName: 'pool', username: 'user', userAttributes },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectorySetUserAttributes('pool', 'user', userAttributes), true);

    expect(returned).toBe(true);
  });
});

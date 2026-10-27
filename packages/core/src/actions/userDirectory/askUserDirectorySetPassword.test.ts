import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectorySetPassword } from './askUserDirectorySetPassword';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectorySetPassword', () => {
  it('yields a SetPassword action carrying the directory, username and new password', () => {
    const { action } = captureRequester(askUserDirectorySetPassword('pool', 'user', 'new'));

    expect(action).toEqual({
      type: UserDirectoryActionType.SetPassword,
      payload: { userDirectoryName: 'pool', username: 'user', newPassword: 'new' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectorySetPassword('pool', 'user', 'new'), true);

    expect(returned).toBe(true);
  });
});

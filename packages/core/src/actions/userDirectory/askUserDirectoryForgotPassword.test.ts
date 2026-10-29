import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserDirectoryForgotPassword } from './askUserDirectoryForgotPassword';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryForgotPassword', () => {
  it('yields a ForgotPassword action carrying the directory and username', () => {
    const { action } = captureRequester(askUserDirectoryForgotPassword('pool', 'user'));

    expect(action).toEqual({
      type: UserDirectoryActionType.ForgotPassword,
      payload: { userDirectoryName: 'pool', username: 'user' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryForgotPassword('pool', 'user'), true);

    expect(returned).toBe(true);
  });
});

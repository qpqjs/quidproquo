import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryConfirmForgotPassword } from './askUserDirectoryConfirmForgotPassword';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryConfirmForgotPassword', () => {
  it('yields a ConfirmForgotPassword action carrying the reset fields', () => {
    const { action } = captureRequester(askUserDirectoryConfirmForgotPassword('pool', '123456', 'user', 'pw'));

    expect(action).toEqual({
      type: UserDirectoryActionType.ConfirmForgotPassword,
      payload: { userDirectoryName: 'pool', code: '123456', username: 'user', password: 'pw' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryConfirmForgotPassword('pool', '123456', 'user', 'pw'), true);

    expect(returned).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryConfirmEmailVerification } from './askUserDirectoryConfirmEmailVerification';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryConfirmEmailVerification', () => {
  it('yields a ConfirmEmailVerification action carrying the code and access token', () => {
    const { action } = captureRequester(askUserDirectoryConfirmEmailVerification('123456', 'token'));

    expect(action).toEqual({
      type: UserDirectoryActionType.ConfirmEmailVerification,
      payload: { code: '123456', accessToken: 'token' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryConfirmEmailVerification('123456', 'token'), true);

    expect(returned).toBe(true);
  });
});

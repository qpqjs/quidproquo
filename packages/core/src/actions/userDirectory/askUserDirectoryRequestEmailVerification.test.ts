import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryRequestEmailVerification } from './askUserDirectoryRequestEmailVerification';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryRequestEmailVerification', () => {
  it('yields a RequestEmailVerification action carrying the directory and access token', () => {
    const { action } = captureRequester(askUserDirectoryRequestEmailVerification('pool', 'token'));

    expect(action).toEqual({
      type: UserDirectoryActionType.RequestEmailVerification,
      payload: { userDirectoryName: 'pool', accessToken: 'token' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryRequestEmailVerification('pool', 'token'), true);

    expect(returned).toBe(true);
  });
});

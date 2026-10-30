import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserDirectoryRevokeRefreshToken } from './askUserDirectoryRevokeRefreshToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryRevokeRefreshToken', () => {
  it('yields a RevokeRefreshToken action carrying its arguments', () => {
    const { action } = captureRequester(askUserDirectoryRevokeRefreshToken('pool', 'refresh'));

    expect(action).toEqual({ type: UserDirectoryActionType.RevokeRefreshToken, payload: { userDirectoryName: 'pool', refreshToken: 'refresh' } });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryRevokeRefreshToken('pool', 'refresh'), undefined);

    expect(returned).toEqual(undefined);
  });
});

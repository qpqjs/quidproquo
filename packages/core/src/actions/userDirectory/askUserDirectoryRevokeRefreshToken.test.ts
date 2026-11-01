import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserDirectoryRevokeRefreshToken } from './askUserDirectoryRevokeRefreshToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryRevokeRefreshToken', () => {
  it('yields a RevokeRefreshToken action carrying its arguments', () => {
    const { action } = captureRequester(askUserDirectoryRevokeRefreshToken('pool', 'refresh'));

    expect(action).toEqual({ type: UserDirectoryActionType.RevokeRefreshToken, payload: { userDirectoryName: 'pool', refreshToken: 'refresh' } });
  });

  // The result type is void, so the runtime's answer is a sentinel here: a requester that dropped the
  // resolved value would return undefined and pass a check against undefined.
  it('returns the value the runtime resolves', () => {
    const sentinel = { resolvedBy: 'runtime' };
    const { returned } = captureRequester(askUserDirectoryRevokeRefreshToken('pool', 'refresh'), sentinel);

    expect(returned).toBe(sentinel);
  });
});

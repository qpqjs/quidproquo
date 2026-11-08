import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserDirectorySignOutUser } from './askUserDirectorySignOutUser';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectorySignOutUser', () => {
  it('yields a SignOutUser action carrying its arguments', () => {
    const { action } = captureRequester(askUserDirectorySignOutUser('token'));

    expect(action).toEqual({ type: UserDirectoryActionType.SignOutUser, payload: { accessToken: 'token' } });
  });

  // The result type is void, so the runtime's answer is a sentinel here: a requester that dropped the
  // resolved value would return undefined and pass a check against undefined.
  it('returns the value the runtime resolves', () => {
    const sentinel = { resolvedBy: 'runtime' };
    const { returned } = captureRequester(askUserDirectorySignOutUser('token'), sentinel);

    expect(returned).toBe(sentinel);
  });
});

import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserDirectorySignOutUser } from './askUserDirectorySignOutUser';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectorySignOutUser', () => {
  it('yields a SignOutUser action carrying its arguments', () => {
    const { action } = captureRequester(askUserDirectorySignOutUser('token'));

    expect(action).toEqual({ type: UserDirectoryActionType.SignOutUser, payload: { accessToken: 'token' } });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectorySignOutUser('token'), undefined);

    expect(returned).toEqual(undefined);
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryGetUsers } from './askUserDirectoryGetUsers';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryGetUsers', () => {
  it('yields a GetUsers action carrying the directory and page key', () => {
    const { action } = captureRequester(askUserDirectoryGetUsers('pool', 'page-2'));

    expect(action).toEqual({
      type: UserDirectoryActionType.GetUsers,
      payload: { userDirectoryName: 'pool', nextPageKey: 'page-2' },
    });
  });

  it('leaves the page key undefined when omitted', () => {
    const { action } = captureRequester(askUserDirectoryGetUsers('pool'));

    expect(action.payload).toEqual({ userDirectoryName: 'pool', nextPageKey: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryGetUsers('pool'), { users: [] });

    expect(returned).toEqual({ users: [] });
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryGetUsersByAttribute } from './askUserDirectoryGetUsersByAttribute';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryGetUsersByAttribute', () => {
  it('yields a GetUsersByAttribute action carrying every field', () => {
    const { action } = captureRequester(askUserDirectoryGetUsersByAttribute('pool', 'email', 'a@b.com', 10, 'page-2'));

    expect(action).toEqual({
      type: UserDirectoryActionType.GetUsersByAttribute,
      payload: { userDirectoryName: 'pool', attribueName: 'email', attribueValue: 'a@b.com', limit: 10, nextPageKey: 'page-2' },
    });
  });

  it('leaves limit and page key undefined when omitted', () => {
    const { action } = captureRequester(askUserDirectoryGetUsersByAttribute('pool', 'email', 'a@b.com'));

    expect(action.payload).toEqual({
      userDirectoryName: 'pool',
      attribueName: 'email',
      attribueValue: 'a@b.com',
      limit: undefined,
      nextPageKey: undefined,
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryGetUsersByAttribute('pool', 'email', 'a@b.com'), { users: [] });

    expect(returned).toEqual({ users: [] });
  });
});

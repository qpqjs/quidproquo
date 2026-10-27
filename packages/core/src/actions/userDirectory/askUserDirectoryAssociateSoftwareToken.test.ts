import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryAssociateSoftwareToken } from './askUserDirectoryAssociateSoftwareToken';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryAssociateSoftwareToken', () => {
  it('yields an AssociateSoftwareToken action carrying the directory and session', () => {
    const { action } = captureRequester(askUserDirectoryAssociateSoftwareToken('pool', 'session-1'));

    expect(action).toEqual({
      type: UserDirectoryActionType.AssociateSoftwareToken,
      payload: { userDirectoryName: 'pool', session: 'session-1' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryAssociateSoftwareToken('pool', 'session-1'), { secretCode: 'abc' });

    expect(returned).toEqual({ secretCode: 'abc' });
  });
});

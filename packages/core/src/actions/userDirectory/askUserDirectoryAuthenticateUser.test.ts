import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { ErrorActionType } from '../error/ErrorActionType';
import { askUserDirectoryAuthenticateUser, askUserDirectoryAuthenticateUserBase } from './askUserDirectoryAuthenticateUser';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryAuthenticateUser', () => {
  it('yields a standard authentication request carrying email and password', () => {
    const { action } = captureRequester(askUserDirectoryAuthenticateUser('pool', false, 'a@b.com', 'pw'));

    expect(action).toEqual({
      type: UserDirectoryActionType.AuthenticateUser,
      payload: {
        userDirectoryName: 'pool',
        authenticateUserRequest: { isCustom: false, email: 'a@b.com', password: 'pw' },
      },
    });
  });

  it('omits the password when the request is custom', () => {
    const { action } = captureRequester(askUserDirectoryAuthenticateUser('pool', true, 'a@b.com'));

    expect(action).toEqual({
      type: UserDirectoryActionType.AuthenticateUser,
      payload: {
        userDirectoryName: 'pool',
        authenticateUserRequest: { isCustom: true, email: 'a@b.com' },
      },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryAuthenticateUser('pool', false, 'a@b.com', 'pw'), { challenge: 'NONE' });

    expect(returned).toEqual({ challenge: 'NONE' });
  });

  it('throws InvalidPassword when a standard sign-in has no password', () => {
    const { action } = captureRequester(askUserDirectoryAuthenticateUser('pool', false, 'a@b.com'));

    expect(action).toEqual({
      type: ErrorActionType.ThrowError,
      payload: {
        errorType: askUserDirectoryAuthenticateUserBase.errorType.InvalidPassword,
        errorText: 'Password required',
        errorStack: undefined,
      },
    });
  });

  it('throws InvalidPassword when a standard sign-in has an empty password', () => {
    const { action } = captureRequester(askUserDirectoryAuthenticateUser('pool', false, 'a@b.com', ''));

    expect(action.type).toBe(ErrorActionType.ThrowError);
  });
});

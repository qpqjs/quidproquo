import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryCreateUser } from './askUserDirectoryCreateUser';
import { CreateUserRequest } from './askUserDirectoryCreateUser';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryCreateUser', () => {
  const createUserRequest: CreateUserRequest = { email: 'a@b.com', emailVerified: true, password: 'pw' };

  it('yields a CreateUser action carrying the directory and request', () => {
    const { action } = captureRequester(askUserDirectoryCreateUser('pool', createUserRequest));

    expect(action).toEqual({
      type: UserDirectoryActionType.CreateUser,
      payload: { userDirectoryName: 'pool', createUserRequest },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryCreateUser('pool', createUserRequest), { challenge: 'NONE' });

    expect(returned).toEqual({ challenge: 'NONE' });
  });
});

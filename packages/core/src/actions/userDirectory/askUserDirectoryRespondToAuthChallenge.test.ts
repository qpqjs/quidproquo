import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askUserDirectoryRespondToAuthChallenge } from './askUserDirectoryRespondToAuthChallenge';
import { AnyAuthChallenge, AuthenticateUserChallenge } from './types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

describe('askUserDirectoryRespondToAuthChallenge', () => {
  const authChallenge: AnyAuthChallenge = {
    challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
    username: 'user',
    session: 'session-1',
    mfaCode: '123456',
  };

  it('yields a RespondToAuthChallenge action carrying the directory and challenge', () => {
    const { action } = captureRequester(askUserDirectoryRespondToAuthChallenge('pool', authChallenge));

    expect(action).toEqual({
      type: UserDirectoryActionType.RespondToAuthChallenge,
      payload: { userDirectoryName: 'pool', authChallenge },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askUserDirectoryRespondToAuthChallenge('pool', authChallenge), { challenge: 'NONE' });

    expect(returned).toEqual({ challenge: 'NONE' });
  });
});

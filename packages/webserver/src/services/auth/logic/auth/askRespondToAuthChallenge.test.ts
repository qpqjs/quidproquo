import {
  Action,
  AnyAuthChallenge,
  AuthenticateUserChallenge,
  AuthenticateUserResponse,
  ConfigActionType,
  runStory,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askRespondToAuthChallenge } from './askRespondToAuthChallenge';

describe('askRespondToAuthChallenge', () => {
  it('responds against the resolved directory and returns the response', () => {
    const challenge: AnyAuthChallenge = {
      challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
      username: 'a@b.com',
      session: 's',
      mfaCode: '123456',
    };
    const authResponse = { challenge: AuthenticateUserChallenge.NONE } as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askRespondToAuthChallenge(challenge), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.RespondToAuthChallenge]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'my-directory', authChallenge: challenge });
    expect(result).toBe(authResponse);
  });
});

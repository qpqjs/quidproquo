import { Action, AuthenticateUserResponse, ConfigActionType, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthConfirmForgotPassword } from './askAuthConfirmForgotPassword';

describe('askAuthConfirmForgotPassword', () => {
  it('confirms the reset against the resolved directory and returns the response', () => {
    const authResponse = { challenge: 'NONE' } as unknown as AuthenticateUserResponse;
    let captured: Action<any> | undefined;

    const result = runStory(askAuthConfirmForgotPassword('a@b.com', 'code-1', 'new-pw'), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.ConfirmForgotPassword]: (action: Action<any>) => {
        captured = action;
        return authResponse;
      },
    });

    expect(captured?.payload).toEqual({
      userDirectoryName: 'my-directory',
      code: 'code-1',
      username: 'a@b.com',
      password: 'new-pw',
    });
    expect(result).toBe(authResponse);
  });
});

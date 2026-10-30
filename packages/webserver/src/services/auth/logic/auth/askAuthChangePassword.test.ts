import { Action, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthChangePassword } from './askAuthChangePassword';

describe('askAuthChangePassword', () => {
  it('changes the password via the access token without resolving a directory', () => {
    let captured: Action<any> | undefined;

    runStory(askAuthChangePassword('old-pw', 'new-pw', 'access-tok'), {
      [UserDirectoryActionType.ChangePassword]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload).toEqual({ oldPassword: 'old-pw', newPassword: 'new-pw', accessToken: 'access-tok' });
  });
});

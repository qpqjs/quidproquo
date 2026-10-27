import { Action, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askChangePassword } from './askChangePassword';

describe('askChangePassword', () => {
  it('changes the password via the access token without resolving a directory', () => {
    let captured: Action<any> | undefined;

    runStory(askChangePassword('old-pw', 'new-pw', 'access-tok'), {
      [UserDirectoryActionType.ChangePassword]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload).toEqual({ oldPassword: 'old-pw', newPassword: 'new-pw', accessToken: 'access-tok' });
  });
});

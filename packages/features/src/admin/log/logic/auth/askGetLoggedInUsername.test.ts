import { Action, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetLoggedInUsername } from './askGetLoggedInUsername';

describe('askGetLoggedInUsername', () => {
  it('reads the admin access token and returns its username', () => {
    let captured: Action<any> | undefined;

    const result = runStory(askGetLoggedInUsername(), {
      [UserDirectoryActionType.ReadAccessToken]: (action: Action<any>) => {
        captured = action;
        return { username: 'joe' };
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'qpq-admin', ignoreExpiration: false });
    expect(result).toBe('joe');
  });
});

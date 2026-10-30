import { Action, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askAuthGetLoggedInUsername } from './askAuthGetLoggedInUsername';

describe('askAuthGetLoggedInUsername', () => {
  it('reads the admin access token and returns its username', () => {
    let captured: Action<any> | undefined;

    const result = runStory(askAuthGetLoggedInUsername(), {
      [UserDirectoryActionType.ReadAccessToken]: (action: Action<any>) => {
        captured = action;
        return { username: 'joe' };
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'qpq-admin', ignoreExpiration: false });
    expect(result).toBe('joe');
  });
});

import { ConfigActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from '../../config';
import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

describe('askAuthGetUserDirectoryName', () => {
  it('reads the auth user directory global', () => {
    const { action } = captureRequester(askAuthGetUserDirectoryName());

    expect(action).toEqual({
      type: ConfigActionType.GetGlobal,
      payload: { globalName: AUTH_USER_DIRECTORY_GLOBAL_KEY },
    });
  });

  it('returns the resolved directory name', () => {
    const { returned } = captureRequester(askAuthGetUserDirectoryName(), 'my-directory');

    expect(returned).toBe('my-directory');
  });
});

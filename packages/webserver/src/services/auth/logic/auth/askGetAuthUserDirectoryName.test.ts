import { captureRequester, ConfigActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from '../../config';
import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

describe('askGetAuthUserDirectoryName', () => {
  it('reads the auth user directory global', () => {
    const { action } = captureRequester(askGetAuthUserDirectoryName());

    expect(action).toEqual({
      type: ConfigActionType.GetGlobal,
      payload: { globalName: AUTH_USER_DIRECTORY_GLOBAL_KEY },
    });
  });

  it('returns the resolved directory name', () => {
    const { returned } = captureRequester(askGetAuthUserDirectoryName(), 'my-directory');

    expect(returned).toBe('my-directory');
  });
});

import { Action, AssociateSoftwareTokenResult, ConfigActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askAssociateSoftwareToken } from './askAssociateSoftwareToken';

describe('askAssociateSoftwareToken', () => {
  it('associates a token against the resolved directory and returns the result', () => {
    const tokenResult = { secretCode: 'abc123' } as AssociateSoftwareTokenResult;
    let captured: Action<any> | undefined;

    const result = runStory(askAssociateSoftwareToken('session-1'), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.AssociateSoftwareToken]: (action: Action<any>) => {
        captured = action;
        return tokenResult;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'my-directory', session: 'session-1' });
    expect(result).toBe(tokenResult);
  });
});

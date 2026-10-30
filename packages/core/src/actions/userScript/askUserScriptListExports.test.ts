import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptListExports } from './askUserScriptListExports';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptListExports', () => {
  it('yields a ListExports action naming the built file', () => {
    const { action } = captureRequester(askUserScriptListExports('scripts', 'a/main.js', 'tenant-a'));

    expect(action).toEqual({ type: UserScriptActionType.ListExports, payload: { drive: 'scripts', filepath: 'a/main.js', scope: 'tenant-a' } });
  });

  it('returns the exports the runner reports', () => {
    const exports = { functions: ['add'], nonFunctions: [] };

    expect(captureRequester(askUserScriptListExports('scripts', 'a/main.js'), exports).returned).toBe(exports);
  });

  it('exposes its catalog', () => {
    expect(askUserScriptListExports.errorType.ScriptInvalid).toBe(`${UserScriptActionType.ListExports}-ScriptInvalid`);
  });
});

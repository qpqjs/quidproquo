import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptModuleTypes } from './askUserScriptModuleTypes';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptModuleTypes', () => {
  it('yields a ModuleTypes action with no payload', () => {
    const { action } = captureRequester(askUserScriptModuleTypes());

    expect(action).toEqual({ type: UserScriptActionType.ModuleTypes, payload: undefined });
  });

  it('returns the declarations the runtime resolves', () => {
    const types = [{ moduleName: 'my-sdk/v1', declarations: 'export declare const x: number;' }];

    expect(captureRequester(askUserScriptModuleTypes(), types).returned).toBe(types);
  });
});

import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { createUserScriptCaller } from './createUserScriptCaller';
import { UserScriptActionType } from './UserScriptActionType';

type ReportScriptFunctions = {
  build: (rows: number[], title?: string) => string;
};

describe('createUserScriptCaller', () => {
  it('yields the same Execute action askUserScriptExecute would', () => {
    const caller = createUserScriptCaller<ReportScriptFunctions>('scripts', 'tenant-a/report/main.js');

    const { action } = captureRequester(caller.build([1, 2], undefined));

    expect(action).toEqual({
      type: UserScriptActionType.Execute,
      payload: {
        drive: 'scripts',
        filepath: 'tenant-a/report/main.js',
        functionName: 'build',
        args: [[1, 2], undefined],
        scope: undefined,
      },
    });
  });

  it('returns the result the runtime resolves', () => {
    const caller = createUserScriptCaller<ReportScriptFunctions>('scripts', 'tenant-a/report/main.js');

    const { returned } = captureRequester(caller.build([1]), 'report');

    expect(returned).toBe('report');
  });
});

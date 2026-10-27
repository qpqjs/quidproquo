import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { createDynamicFunctionCaller } from './createDynamicFunctionCaller';
import { DynamicFunctionsActionType } from './DynamicFunctionsActionType';

type TemplateEventDocFunctions = {
  foldSnapshotViews: (events: number[], seedViews?: Record<string, unknown>) => Record<string, unknown>;
};

describe('createDynamicFunctionCaller', () => {
  it('yields the same Execute action askDynamicFunctionExecute would', () => {
    const caller = createDynamicFunctionCaller<TemplateEventDocFunctions>('templateEventDoc');

    const { action } = captureRequester(caller.foldSnapshotViews([1, 2], undefined));

    expect(action).toEqual({
      type: DynamicFunctionsActionType.Execute,
      payload: {
        dynamicFunctionsName: 'templateEventDoc',
        functionName: 'foldSnapshotViews',
        args: [[1, 2], undefined],
      },
    });
  });

  it('returns the result the runtime resolves', () => {
    const caller = createDynamicFunctionCaller<TemplateEventDocFunctions>('templateEventDoc');
    const views = { document: {} };

    const { returned } = captureRequester(caller.foldSnapshotViews([1]), views);

    expect(returned).toBe(views);
  });
});

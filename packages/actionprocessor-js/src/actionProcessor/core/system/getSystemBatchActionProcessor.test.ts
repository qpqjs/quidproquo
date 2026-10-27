import {
  actionResult,
  actionResultError,
  buildTestQpqConfig,
  buildTestStorySession,
  createStubLogger,
  resolveActionResult,
  resolveActionResultError,
  SystemActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getSystemBatchActionProcessor } from './getSystemBatchActionProcessor';

// Minimal leaf processors for the batch to drive.
const actionProcessors = {
  'test/echo': async (payload: { value: string }) => actionResult(payload.value),
  'test/fail': async () => actionResultError('boom', 'it broke'),
};

const runBatch = async (actions: Array<{ type: string; payload?: unknown; returnErrors?: boolean }>) => {
  const processor = (await getSystemBatchActionProcessor(buildTestQpqConfig(), async () => null))[SystemActionType.Batch] as (
    p: any,
    ...rest: any[]
  ) => Promise<any>;

  return processor(
    { actions },
    buildTestStorySession(),
    actionProcessors,
    createStubLogger(),
    () => {},
    async () => null,
    undefined,
  );
};

describe('getSystemBatchActionProcessor', () => {
  it('resolves every action and returns the results in order', async () => {
    const result = await runBatch([
      { type: 'test/echo', payload: { value: 'a' } },
      { type: 'test/echo', payload: { value: 'b' } },
    ]);

    expect(resolveActionResult(result)).toEqual(['a', 'b']);
  });

  it('fails the whole batch when an unflagged action fails', async () => {
    const result = await runBatch([{ type: 'test/echo', payload: { value: 'a' } }, { type: 'test/fail' }]);

    expect(resolveActionResultError(result)).toEqual({ errorType: 'boom', errorText: 'it broke', errorStack: undefined });
  });

  it('wraps a returnErrors action in an Either envelope instead of failing the batch', async () => {
    const result = await runBatch([
      { type: 'test/echo', payload: { value: 'a' }, returnErrors: true },
      { type: 'test/fail', returnErrors: true },
    ]);

    expect(resolveActionResult(result)).toEqual([
      { success: true, result: 'a' },
      { success: false, error: { errorType: 'boom', errorText: 'it broke', errorStack: undefined } },
    ]);
  });

  it('only unwraps to Either for the flagged actions in a mixed batch', async () => {
    const result = await runBatch([
      { type: 'test/echo', payload: { value: 'plain' } },
      { type: 'test/fail', returnErrors: true },
    ]);

    expect(resolveActionResult(result)).toEqual([
      'plain',
      { success: false, error: { errorType: 'boom', errorText: 'it broke', errorStack: undefined } },
    ]);
  });
});

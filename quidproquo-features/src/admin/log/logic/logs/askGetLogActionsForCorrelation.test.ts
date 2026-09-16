import { ActionProcessorResult, FileActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetLogActionsForCorrelation } from './askGetLogActionsForCorrelation';

const okResult = (result: unknown): ActionProcessorResult<unknown> => [result, undefined];
const erroredResult = (): ActionProcessorResult<unknown> => [undefined, { errorType: 'NotFound', errorText: 'nope' }];

describe('askGetLogActionsForCorrelation', () => {
  it('summarizes every history entry with type, timings, and error status', () => {
    const log = {
      correlation: 'corr-1',
      history: [
        {
          act: { type: 'KeyValueStore/Get', payload: { id: '1' } },
          res: okResult({ id: '1' }),
          startedAt: '2026-07-11T00:00:00.000Z',
          finishedAt: '2026-07-11T00:00:00.050Z',
        },
        {
          act: { type: 'File/Read', payload: { path: '/x' } },
          res: erroredResult(),
          startedAt: '2026-07-11T00:00:00.050Z',
          finishedAt: '2026-07-11T00:00:00.200Z',
        },
      ],
    };

    const result = runStory(askGetLogActionsForCorrelation('corr-1'), {
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: log,
    });

    expect(result).toEqual([
      {
        index: 0,
        actionType: 'KeyValueStore/Get',
        startedAt: '2026-07-11T00:00:00.000Z',
        finishedAt: '2026-07-11T00:00:00.050Z',
        executionTimeMs: 50,
        success: true,
        error: undefined,
      },
      {
        index: 1,
        actionType: 'File/Read',
        startedAt: '2026-07-11T00:00:00.050Z',
        finishedAt: '2026-07-11T00:00:00.200Z',
        executionTimeMs: 150,
        success: false,
        error: 'nope',
      },
    ]);
  });

  it('returns an empty list for a log with no actions', () => {
    const result = runStory(askGetLogActionsForCorrelation('corr-empty'), {
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: { correlation: 'corr-empty', history: [] },
    });

    expect(result).toEqual([]);
  });
});

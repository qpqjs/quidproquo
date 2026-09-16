import { ActionProcessorResult, FileActionType, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetLogActionDetail } from './askGetLogActionDetail';

const okResult = (result: unknown): ActionProcessorResult<unknown> => [result, undefined];
const erroredResult = (): ActionProcessorResult<unknown> => [undefined, { errorType: 'NotFound', errorText: 'nope', errorStack: 'stack' }];

const log = {
  correlation: 'corr-1',
  history: [
    {
      act: { type: 'KeyValueStore/Get', payload: { id: '1' } },
      res: okResult({ id: '1', name: 'joe' }),
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

describe('askGetLogActionDetail', () => {
  it('returns the full input/output breakdown for a successful action', () => {
    const result = runStory(askGetLogActionDetail('corr-1', 0), {
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: log,
    });

    expect(result).toEqual({
      index: 0,
      actionType: 'KeyValueStore/Get',
      input: { id: '1' },
      output: { id: '1', name: 'joe' },
      error: undefined,
      startedAt: '2026-07-11T00:00:00.000Z',
      finishedAt: '2026-07-11T00:00:00.050Z',
    });
  });

  it('returns the error instead of output for a failed action', () => {
    const result = runStory(askGetLogActionDetail('corr-1', 1), {
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: log,
    });

    expect(result).toEqual({
      index: 1,
      actionType: 'File/Read',
      input: { path: '/x' },
      output: undefined,
      error: { errorType: 'NotFound', errorText: 'nope' },
      startedAt: '2026-07-11T00:00:00.050Z',
      finishedAt: '2026-07-11T00:00:00.200Z',
    });
  });

  it('throws NotFound for an out-of-range index', () => {
    expect(() =>
      runStory(askGetLogActionDetail('corr-1', 99), {
        [FileActionType.Exists]: true,
        [FileActionType.ReadObjectJson]: log,
      }),
    ).toThrow(StoryError);
  });
});

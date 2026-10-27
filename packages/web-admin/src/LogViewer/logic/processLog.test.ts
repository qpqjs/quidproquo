import { ContextActionType, StoryResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { processLog } from './processLog';

const buildLog = (...types: string[]): StoryResult<any> =>
  ({
    history: types.map((type) => ({ act: { type } })),
  }) as unknown as StoryResult<any>;

describe('processLog', () => {
  it('returns an empty array when there is no log', () => {
    expect(processLog(undefined as unknown as StoryResult<any>)).toEqual([]);
  });

  it('filters out context List actions', () => {
    const result = processLog(buildLog(ContextActionType.List, ContextActionType.Read, ContextActionType.List));

    expect(result).toEqual([{ act: { type: ContextActionType.Read } }]);
  });

  it('keeps the history when there are no List actions', () => {
    const result = processLog(buildLog(ContextActionType.Read));

    expect(result).toHaveLength(1);
  });
});

import { ActionHistory, EventActionType, QpqRuntimeType, StoryResult } from 'quidproquo-core';

// Every generic text extractor takes a StoryResult and branches on its runtimeType, so each
// test file only ever builds results for one runtime. This returns a builder pre-seeded with
// that runtime; individual tests override just the fields they exercise.
export const makeStoryResultBuilder =
  (runtimeType: QpqRuntimeType) =>
  (overrides: Partial<StoryResult<any>> = {}): StoryResult<any> =>
    ({
      input: [],
      session: { depth: 0, context: {} },
      history: [],
      startedAt: '',
      finishedAt: '',
      correlation: '',
      tags: [],
      moduleName: '',
      runtimeType,
      ...overrides,
    }) as StoryResult<any>;

// Extractors read their event payloads out of the GetRecords action result in story history.
export const getRecordsHistory = (res: unknown): ActionHistory => ({
  act: { type: EventActionType.GetRecords },
  res,
  startedAt: '',
  finishedAt: '',
});

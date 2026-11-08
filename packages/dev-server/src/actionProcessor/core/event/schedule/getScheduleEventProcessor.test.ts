import { EventActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getScheduleEventProcessor } from './getScheduleEventProcessor';
import { ScheduleMessageWithSession } from './types';

const message: ScheduleMessageWithSession = {
  storySession: { depth: 0, context: {} },
  runtime: '/entry/schedule/onNightly::onNightly',
  record: { time: '2026-09-01T17:00:00.000Z', correlation: 'corr-1', metadata: { databaseName: 'graph' } },
};

describe('schedule getScheduleEventProcessor', () => {
  it('composes a processor for every event action', async () => {
    const processors = await getScheduleEventProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(Object.keys(processors).sort()).toEqual(
      [
        EventActionType.AutoRespond,
        EventActionType.GetRecords,
        EventActionType.GetStorySession,
        EventActionType.MatchStory,
        EventActionType.TransformResponseResult,
      ].sort(),
    );
  });

  // A schedule firing carries no caller and never short-circuits, so the composer wires the shared no-ops for both.
  it('has no story session of its own and never auto responds', async () => {
    const processors = await getScheduleEventProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    const session = await invokeProcessor(processors[EventActionType.GetStorySession]!, { eventParams: [message] } as any);
    const autoRespond = await invokeProcessor(processors[EventActionType.AutoRespond]!, { eventParams: [message] } as any);

    expect(resolveActionResult(session)).toBeNull();
    expect(resolveActionResult(autoRespond)).toBeNull();
  });
});

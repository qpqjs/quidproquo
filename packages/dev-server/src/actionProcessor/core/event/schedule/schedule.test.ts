import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  EventActionType,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../testing/testProcessorRuntime';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';
import { ScheduleMessageWithSession } from './types';

const message: ScheduleMessageWithSession = {
  storySession: { depth: 0, context: {} },
  runtime: '/entry/schedule/onNightly::onNightly',
  record: {
    time: '2026-09-01T17:00:00.000Z',
    correlation: 'corr-1',
    metadata: { databaseName: 'graph' },
  },
};

describe('schedule event processors', () => {
  it('hands the ticker record straight through', async () => {
    const processors = await getEventGetRecordsActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const result = await invokeProcessor(processors[EventActionType.GetRecords], { eventParams: [message] } as any);

    expect(resolveActionResult(result)).toEqual([message.record]);
  });

  it('matches the story the message names', async () => {
    // Deployed, the runtime comes from a per-schedule lambda env var. Locally
    // one process serves every schedule, so it has to travel with the message.
    const processors = await getEventMatchStoryActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const result = await invokeProcessor(processors[EventActionType.MatchStory], { eventParams: [message] } as any);

    expect(resolveActionResult(result)).toEqual({ runtime: message.runtime, runtimeOptions: {} });
  });

  it('has no story session of its own', async () => {
    const processors = await getEventGetStorySessionActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const result = await invokeProcessor(processors[EventActionType.GetStorySession], { eventParams: [message] } as any);

    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('never auto responds', async () => {
    const processors = await getEventAutoRespondActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const result = await invokeProcessor(processors[EventActionType.AutoRespond], { eventParams: [message] } as any);

    expect(resolveActionResult(result)).toBeNull();
  });

  it('returns nothing when the story succeeded', async () => {
    const processors = await getEventTransformResponseResultActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const result = await invokeProcessor(processors[EventActionType.TransformResponseResult], {
      eventParams: [message],
      qpqEventRecordResponses: [{ success: true, result: undefined }],
    } as any);

    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('rethrows a story that failed', async () => {
    // The ticker catches this and logs; what matters here is that the failure
    // is not swallowed into a successful-looking run.
    const processors = await getEventTransformResponseResultActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    const result = await invokeProcessor(processors[EventActionType.TransformResponseResult], {
      eventParams: [message],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom', errorStack: undefined } }],
    } as any);

    expect(resolveActionResultError(result)).toEqual(expect.objectContaining({ errorType: ErrorTypeEnum.GenericError, errorText: 'boom' }));
  });
});

import { ErrorTypeEnum, EventActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('eventBridgeEvent/recurringSchedule getEventGetRecordsActionProcessor', () => {
  it('maps the schedule event to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { time: '2024-01-01T00:00:00Z', detail: { foo: 'bar' } };

    const [records] = await processor({ eventParams: [event, { awsRequestId: 'req-1' }] });

    expect(records).toEqual([{ time: '2024-01-01T00:00:00Z', correlation: 'req-1', metadata: { foo: 'bar' } }]);
  });
});

describe('eventBridgeEvent/recurringSchedule getEventMatchStoryActionProcessor', () => {
  it('returns the runtime from the lambda runtime config with empty options', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [match] = await processor({ qpqEventRecord: {} });

    expect(match).toEqual({ runtime: undefined, runtimeOptions: {} });
  });
});

describe('eventBridgeEvent/recurringSchedule getEventTransformResponseResultActionProcessor', () => {
  it('returns void for a successful record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('propagates a failed record as an error result', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } }],
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});

describe('eventBridgeEvent/recurringSchedule auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});

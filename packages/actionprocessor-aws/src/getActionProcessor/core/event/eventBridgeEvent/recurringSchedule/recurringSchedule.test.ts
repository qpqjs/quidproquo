import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

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

  // Security regression: the rule's target input is fixed config metadata plus the firing time, so only those
  // three fields reach the story; anything else on the raw event (resources, source, account) is dropped.
  it('copies only the time, request id and detail from the raw event', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      time: '2024-01-01T00:00:00Z',
      detail: { scheduleName: 'nightly' },
      source: 'aws.events',
      account: '123456789012',
      resources: ['arn:aws:events:us-east-1:123456789012:rule/other'],
      'detail-type': 'Scheduled Event',
    };

    const [records] = await processor({ eventParams: [event, { awsRequestId: 'req-1', functionName: 'fn' }] });

    expect(Object.keys((records as any[])[0]).sort()).toEqual(['correlation', 'metadata', 'time']);
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

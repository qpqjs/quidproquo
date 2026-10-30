import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

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

import { EventActionType, NotifyErrorQueueEvents } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const buildAlarm = (metricName: string): Record<string, unknown> => ({
  AlarmName: 'alarm',
  Trigger: { MetricName: metricName, Namespace: 'AWS/Lambda' },
  NewStateReason: 'because',
  NewStateValue: 'ALARM',
  OldStateValue: 'OK',
});

describe('sqs/queue getEventGetRecordsActionProcessor', () => {
  it('maps a regular queue message', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const record = { messageId: 'm1', body: JSON.stringify({ type: 'orderCreated', payload: { id: 1 }, storySession: {} }) };

    const [records] = await processor({ eventParams: [{ Records: [record] }, {}] });

    expect(records).toEqual([{ message: { type: 'orderCreated', payload: { id: 1 } }, id: 'm1', groupId: undefined }]);
  });

  it('maps the FIFO message group id from the record attributes', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const record = {
      messageId: 'm1',
      body: JSON.stringify({ type: 'orderCreated', payload: { id: 1 }, storySession: {} }),
      attributes: { MessageGroupId: 'group-1' },
    };

    const [records] = await processor({ eventParams: [{ Records: [record] }, {}] });

    expect(records).toEqual([{ message: { type: 'orderCreated', payload: { id: 1 } }, id: 'm1', groupId: 'group-1' }]);
  });

  it.each([
    ['Errors', NotifyErrorQueueEvents.Error],
    ['Timeout', NotifyErrorQueueEvents.Timeout],
    ['Throttles', NotifyErrorQueueEvents.Throttle],
    ['Something', NotifyErrorQueueEvents.Unknown],
  ])('maps a %s cloudwatch alarm to a %s queue event', async (metricName: string, expectedType: NotifyErrorQueueEvents) => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const record = { messageId: 'm1', body: JSON.stringify(buildAlarm(metricName)) };

    const [records] = await processor({ eventParams: [{ Records: [record] }, {}] });

    expect(records).toEqual([
      { id: 'm1', message: { type: expectedType, payload: { newStateReason: 'because', newStateInAlarm: true, oldStateInAlarm: false } } },
    ]);
  });
});

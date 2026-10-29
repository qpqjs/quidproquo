import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const buildAlarm = (metricName: string): Record<string, unknown> => ({
  AlarmName: 'alarm',
  Trigger: { MetricName: metricName, Namespace: 'AWS/Lambda' },
  NewStateReason: 'because',
  NewStateValue: 'ALARM',
  OldStateValue: 'OK',
});

describe('sqs/queue getEventTransformResponseResultActionProcessor', () => {
  it('reports batch item failures for unsuccessful records', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const sqsEvent = { Records: [{ messageId: 'a' }, { messageId: 'b' }] };

    const [response] = await processor({ eventParams: [sqsEvent], qpqEventRecordResponses: [{ success: true }, { success: false }] });

    expect(response).toEqual({ batchItemFailures: [{ itemIdentifier: 'b' }] });
  });

  it('reports the original record ids when failures are interleaved with successes', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const sqsEvent = { Records: [{ messageId: 'a' }, { messageId: 'b' }, { messageId: 'c' }] };

    const [response] = await processor({
      eventParams: [sqsEvent],
      qpqEventRecordResponses: [{ success: false }, { success: true }, { success: false }],
    });

    expect(response).toEqual({ batchItemFailures: [{ itemIdentifier: 'a' }, { itemIdentifier: 'c' }] });
  });
});

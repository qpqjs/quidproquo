import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

const buildAlarm = (metricName: string): Record<string, unknown> => ({
  AlarmName: 'alarm',
  Trigger: { MetricName: metricName, Namespace: 'AWS/Lambda' },
  NewStateReason: 'because',
  NewStateValue: 'ALARM',
  OldStateValue: 'OK',
});

describe('sqs/queue getEventGetStorySessionActionProcessor', () => {
  it('returns the story session from the source record', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);
    const session = { depth: 1 };
    const sqsEvent = { Records: [{ messageId: 'm1', body: JSON.stringify({ type: 't', payload: {}, storySession: session }) }] };

    const [result] = await processor({ qpqEventRecord: { id: 'm1' }, eventParams: [sqsEvent] });

    expect(result).toEqual(session);
  });

  it('drops local context, function globals and the raw access token planted in the message body', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);
    const planted = {
      depth: 1,
      context: { a: 1 },
      localContext: { secret: 'x' },
      functionGlobals: { g: 1 },
      accessToken: 'raw.bearer',
      decodedAccessToken: { userId: 'u1' },
    };
    const sqsEvent = { Records: [{ messageId: 'm1', body: JSON.stringify({ type: 't', payload: {}, storySession: planted }) }] };

    const [result] = await processor({ qpqEventRecord: { id: 'm1' }, eventParams: [sqsEvent] });

    expect(result).toEqual({ depth: 1, context: { a: 1 }, decodedAccessToken: { userId: 'u1' } });
  });

  it('returns no session when the source record is missing', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    const [result] = await processor({ qpqEventRecord: { id: 'missing' }, eventParams: [{ Records: [] }] });

    expect(result).toBeNull();
  });
});

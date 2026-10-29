import { defineQueue, ErrorTypeEnum, EventActionType, NotifyErrorQueueEvents, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor, getQueueConfigSetting } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

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

describe('sqs/queue getQueueConfigSetting', () => {
  it('looks up the queue config setting named by the environment', () => {
    const setting = defineQueue('q', {});

    expect(getQueueConfigSetting(buildTestQpqConfig([setting]), 'q')).toEqual(setting);
  });

  it('throws when the named queue is not in the config', () => {
    expect(() => getQueueConfigSetting(buildTestQpqConfig([]), 'missing')).toThrow('No queue config setting found for queue [missing]');
  });
});

describe('sqs/queue getEventMatchStoryActionProcessor', () => {
  const runtime: QpqFunctionRuntime = '/entry/queue::onOrder';

  const buildConfig = (eventBusSubscriptions: string[] = []) =>
    buildTestQpqConfig([defineQueue('q', { orderCreated: runtime }, { eventBusSubscriptions })]);

  it('matches a queue message type to its processor', async () => {
    const processor = await resolveEventProcessor(
      getEventMatchStoryActionProcessor(() => 'q'),
      EventActionType.MatchStory,
      buildConfig(),
    );

    const [match] = await processor({ qpqEventRecord: { message: { type: 'orderCreated' } } });

    expect((match as any).runtime).toEqual(runtime);
  });

  it('returns a NotFound error when no queue type matches and there are no subscriptions', async () => {
    const processor = await resolveEventProcessor(
      getEventMatchStoryActionProcessor(() => 'q'),
      EventActionType.MatchStory,
      buildConfig(),
    );

    const [, error] = await processor({ qpqEventRecord: { message: { type: 'unknown' } } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('exits gracefully with an empty match when there are event bus subscriptions', async () => {
    const processor = await resolveEventProcessor(
      getEventMatchStoryActionProcessor(() => 'q'),
      EventActionType.MatchStory,
      buildConfig(['sub']),
    );

    const [match] = await processor({ qpqEventRecord: { message: { type: 'unknown' } } });

    expect(match).toEqual({});
  });
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

describe('sqs/queue getEventAutoRespondActionProcessor', () => {
  it('signals graceful completion when there is no matched runtime', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ matchResult: {} })).toEqual([true]);
  });

  it('continues processing when a runtime matched', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ matchResult: { runtime: { src: 'x' } } })).toEqual([null]);
  });
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

    expect(result).toBeUndefined();
  });
});

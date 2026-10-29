import { defineQueue, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const buildAlarm = (metricName: string): Record<string, unknown> => ({
  AlarmName: 'alarm',
  Trigger: { MetricName: metricName, Namespace: 'AWS/Lambda' },
  NewStateReason: 'because',
  NewStateValue: 'ALARM',
  OldStateValue: 'OK',
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

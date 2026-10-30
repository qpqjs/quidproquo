import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

const buildAlarm = (metricName: string): Record<string, unknown> => ({
  AlarmName: 'alarm',
  Trigger: { MetricName: metricName, Namespace: 'AWS/Lambda' },
  NewStateReason: 'because',
  NewStateValue: 'ALARM',
  OldStateValue: 'OK',
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

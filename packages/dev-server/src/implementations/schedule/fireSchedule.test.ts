import { QpqRuntimeType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processEvent } from '../../logic';
import { fireSchedule } from './fireSchedule';

vi.mock('../../logic', () => ({ processEvent: vi.fn() }));

const job = {
  serviceName: 'svc',
  uniqueKey: 'nightly',
  qpqConfig: buildTestQpqConfig(),
  schedule: { runtime: '/src/entry/nightly::askNightly', metadata: { job: 'nightly' } },
} as any;

const devServerConfig = { dynamicModuleLoader: vi.fn() } as any;

describe('fireSchedule', () => {
  beforeEach(() => vi.mocked(processEvent).mockReset());

  // Security regression: a scheduled story starts from a blank session and sees only the firing time, a fresh
  // correlation and the static config metadata, the same shape the EventBridge rule hands the deployed lambda.
  it('runs the schedule with a blank session and only time, correlation and config metadata', async () => {
    await fireSchedule(job, devServerConfig, new Date('2026-10-28T01:02:00.000Z'));

    const [message, , , , runtimeType, getStorySession] = vi.mocked(processEvent).mock.calls[0];
    expect(runtimeType).toBe(QpqRuntimeType.RECURRING_SCHEDULE);
    expect(message.storySession).toEqual({ depth: 0, context: {} });
    expect(getStorySession(message)).toEqual({ depth: 0, context: {} });
    expect(Object.keys(message.record).sort()).toEqual(['correlation', 'metadata', 'time']);
    expect(message.record.time).toBe('2026-10-28T01:02:00.000Z');
    expect(message.record.metadata).toEqual({ job: 'nightly' });
  });
});

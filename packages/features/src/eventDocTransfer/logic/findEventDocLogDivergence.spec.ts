import { QpqIsoDateTime } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EventDocEvent } from '../../eventDoc/models';
import { findEventDocLogDivergence } from './findEventDocLogDivergence';

const eventId = (n: number): number => n;

const event = (index: number, overrides?: { type?: string; clientMessageId?: string; createdAt?: string }): EventDocEvent => ({
  type: overrides?.type ?? 'SET_THING',
  payload: {
    data: { thing: index },
    metadata: {
      version: 1,
      clientMessageId: overrides?.clientMessageId ?? `msg-${index}`,
      createdBy: { userId: 'user-1', userDisplayName: 'User One' },
      createdAt: (overrides?.createdAt ?? `2026-07-26T00:00:0${index}.000Z`) as QpqIsoDateTime,
      eventId: eventId(index),
    },
  },
});

const log = (length: number): EventDocEvent[] => Array.from({ length }, (_unused, index) => event(index));

describe('findEventDocLogDivergence', () => {
  it('reports a clean fast-forward when the existing log is a prefix', () => {
    expect(findEventDocLogDivergence(log(2), log(5))).toEqual({ diverged: false, sharedCount: 2, existingAhead: false });
  });

  it('reports identical logs as a full shared prefix', () => {
    expect(findEventDocLogDivergence(log(4), log(4))).toEqual({ diverged: false, sharedCount: 4, existingAhead: false });
  });

  it('treats an empty target as a fast-forward from zero', () => {
    expect(findEventDocLogDivergence([], log(3))).toEqual({ diverged: false, sharedCount: 0, existingAhead: false });
  });

  it('flags the target as ahead without calling it a divergence', () => {
    // Nothing DISAGREES, the bundle is simply older than what is already here - still not importable.
    expect(findEventDocLogDivergence(log(6), log(4))).toEqual({ diverged: false, sharedCount: 4, existingAhead: true });
  });

  it('finds the first index where the logs disagree', () => {
    const existing = log(4);
    const incoming = log(4);
    incoming[2] = event(2, { clientMessageId: 'edited-in-target' });

    expect(findEventDocLogDivergence(existing, incoming)).toEqual({ diverged: true, atIndex: 2 });
  });

  it('treats a different event type at the same index as a divergence', () => {
    const existing = log(3);
    const incoming = log(3);
    incoming[1] = event(1, { type: 'SET_SOMETHING_ELSE' });

    expect(findEventDocLogDivergence(existing, incoming)).toEqual({ diverged: true, atIndex: 1 });
  });

  it('treats a re-created event with a fresh timestamp as a divergence', () => {
    // The same logical edit made independently in both environments is NOT the same event.
    const existing = log(2);
    const incoming = log(2);
    incoming[1] = event(1, { createdAt: '2026-07-27T09:00:00.000Z' });

    expect(findEventDocLogDivergence(existing, incoming)).toEqual({ diverged: true, atIndex: 1 });
  });
});

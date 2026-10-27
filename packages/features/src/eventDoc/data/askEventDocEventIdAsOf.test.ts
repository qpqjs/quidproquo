import { KeyValueStoreActionType, QpqIsoDateTime, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocEvent } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { askEventDocEventIdAsOf } from './askEventDocEventIdAsOf';

// This anchors the "as you would have seen it then" resolvers: the newest event at or
// before the clock is the log position an as-of-time state folds up to. It walks the log
// BACKWARDS with an early exit, so the tests also pin that only the newest page is read
// when the clock is recent.

const DOC_ID = 'doc-1';
const STORE_NAME = 'content';
const EVENTS_STORE_NAME = eventDocEventsStoreName(STORE_NAME);

const eventId = (n: number): number => n;

const buildEvent = (index: number, createdAt: string): EventDocEvent => ({
  type: 'SET_BODY',
  payload: {
    data: { body: `body-${index}` },
    metadata: {
      version: 1,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'user-1' } as EventDocEvent['payload']['metadata']['createdBy'],
      createdAt: createdAt as QpqIsoDateTime,
      eventId: eventId(index),
    },
  },
});

// A doc edited across four months. No PUBLISH event anywhere — the resolver deliberately
// never consults versions; only the time bound decides.
const EVENTS: EventDocEvent[] = [
  buildEvent(0, '2026-02-01T00:00:00.000Z'),
  buildEvent(1, '2026-04-10T00:00:00.000Z'),
  buildEvent(2, '2026-05-01T00:00:00.000Z'),
  buildEvent(3, '2026-06-20T00:00:00.000Z'),
];

const storedEvents: EventDocStoredEvent[] = EVENTS.map((event) => ({
  pk: DOC_ID,
  sk: event.payload.metadata.eventId,
  type: 'content',
  data: event,
}));

const eventIdAsOf = (clock: string) =>
  runStory(askEventDocProvideStore({ storeName: STORE_NAME, type: 'content' }, askEventDocEventIdAsOf(DOC_ID, clock as QpqIsoDateTime)), {
    [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string; options?: { sortAscending?: boolean; limit?: number } } }) => {
      if (action.payload.keyValueStoreName !== EVENTS_STORE_NAME) {
        throw new Error(`Unexpected store read: ${action.payload.keyValueStoreName}`);
      }

      // The walk must be newest-first — an ascending read would find the OLDEST match.
      expect(action.payload.options?.sortAscending).toBe(false);

      const descending = [...storedEvents].sort((a, b) => String(b.sk).localeCompare(String(a.sk)));
      return { items: descending.slice(0, action.payload.options?.limit), nextPageKey: undefined };
    },
  });

describe('askEventDocEventIdAsOf', () => {
  it('returns the newest event at or before the clock', () => {
    // The referring template published 2026-05-01, so the June edit must not resolve.
    expect(eventIdAsOf('2026-05-15T00:00:00.000Z')).toBe(eventId(2));
  });

  it('includes an event stamped exactly at the clock', () => {
    // The bound is inclusive: an edit made at the publish instant is part of what the author saw.
    expect(eventIdAsOf('2026-04-10T00:00:00.000Z')).toBe(eventId(1));
  });

  it('returns the head when the clock is after every event', () => {
    expect(eventIdAsOf('2026-07-15T00:00:00.000Z')).toBe(eventId(3));
  });

  it('returns null when the clock predates the doc', () => {
    expect(eventIdAsOf('2026-01-01T00:00:00.000Z')).toBeNull();
  });
});

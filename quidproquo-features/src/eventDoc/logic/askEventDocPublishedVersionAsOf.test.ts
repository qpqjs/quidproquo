import {
  DynamicFunctionsActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  QpqIsoDateTime,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocEvent, EventDocSummary, EventDocVersion } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { askEventDocPublishedVersionAsOf } from './askEventDocPublishedVersionAsOf';

// A published render resolves BOTH which version renders and — via the returned version's
// publishedAt — the clock its linked assets resolve at. Getting the version wrong silently renders
// the wrong document, so the selection rules are pinned here: keyed on effectiveFrom (not
// publishedAt), truncated at the version's head, and never guessing when nothing is effective.

const DOC_ID = 'doc-1';

const eventId = (n: number): number => n;

const buildEvent = (index: number): EventDocEvent => ({
  type: 'SET_BODY',
  payload: {
    data: { body: `body-${index}` },
    metadata: {
      version: 1,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'user-1' } as EventDocEvent['payload']['metadata']['createdBy'],
      createdAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
      eventId: eventId(index),
    },
  },
});

// A log of 6 events (ids 0..5) — enough that a version head genuinely truncates it.
const EVENTS: EventDocEvent[] = [0, 1, 2, 3, 4, 5].map(buildEvent);

const buildSummary = (versions: EventDocVersion[], deletedAt?: QpqIsoDateTime): EventDocSummary => ({
  type: 'template',
  id: DOC_ID,
  code: 'tpl-1',
  name: 'Template One',
  createdAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
  updatedAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
  deletedAt,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  versions,
});

// v1 published 03-01 (head @1), v2 published 05-01 (head @3), v3 published 06-01 but not effective
// until 09-01 — a publish scheduled for the future.
const VERSION_1: EventDocVersion = {
  version: 1,
  eventId: eventId(1),
  publishedAt: '2026-03-01T00:00:00.000Z' as QpqIsoDateTime,
  effectiveFrom: '2026-03-01T00:00:00.000Z' as QpqIsoDateTime,
};
const VERSION_2: EventDocVersion = {
  version: 2,
  eventId: eventId(3),
  publishedAt: '2026-05-01T00:00:00.000Z' as QpqIsoDateTime,
  effectiveFrom: '2026-05-01T00:00:00.000Z' as QpqIsoDateTime,
};
const VERSION_3_SCHEDULED: EventDocVersion = {
  version: 3,
  eventId: eventId(5),
  publishedAt: '2026-06-01T00:00:00.000Z' as QpqIsoDateTime,
  effectiveFrom: '2026-09-01T00:00:00.000Z' as QpqIsoDateTime,
};
// The open draft — no publish stamps at all.
const VERSION_DRAFT: EventDocVersion = { version: 4, eventId: eventId(5) };

const storedEvents: EventDocStoredEvent[] = EVENTS.map((event) => ({
  pk: DOC_ID,
  sk: event.payload.metadata.eventId,
  type: 'template',
  data: event,
}));

const STORE_NAME = 'templates';
const EVENTS_STORE_NAME = eventDocEventsStoreName(STORE_NAME);
const SNAPSHOTS_STORE_NAME = eventDocSnapshotsStoreName(STORE_NAME);

// The sort-key bound the state resolver issues (upToEventId → at-or-before) — honoured
// for real so the truncation at the version's head is exercised, not hand-waved.
const skAtOrBefore = (keyCondition: KvsQueryOperation): number | undefined => {
  if ('conditions' in keyCondition) {
    return (keyCondition as KvsLogicalOperator).conditions.map(skAtOrBefore).find((v) => v !== undefined);
  }

  const condition = keyCondition as KvsQueryCondition;
  return condition.key === 'sk' && condition.operation === KvsQueryOperationType.LessThanOrEqual ? Number(condition.valueA) : undefined;
};

// The summary lookup, the snapshot-base lookup and the event list all land on the Query
// action, so the mock partitions by store name: no snapshots exist (the resolver folds
// from scratch), and the registered fold echoes the event ids it was handed so the
// assertions can see exactly which prefix reached it.
const resolveAsOf = (summary: EventDocSummary | null, clock: string) =>
  runStory(askEventDocProvideStore({ storeName: STORE_NAME, type: 'template' }, askEventDocPublishedVersionAsOf(DOC_ID, clock as QpqIsoDateTime)), {
    [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation } }) => {
      if (action.payload.keyValueStoreName === SNAPSHOTS_STORE_NAME) {
        return { items: [], nextPageKey: undefined };
      }
      if (action.payload.keyValueStoreName === EVENTS_STORE_NAME) {
        const upTo = skAtOrBefore(action.payload.keyCondition);
        return { items: storedEvents.filter((row) => upTo === undefined || row.sk <= upTo), nextPageKey: undefined };
      }
      return { items: summary ? [summary] : [], nextPageKey: undefined };
    },

    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [EventDocEvent[]] } }) => ({
      foldedEventIds: action.payload.args[0].map((event) => event.payload.metadata.eventId),
    }),
  });

describe('askEventDocPublishedVersionAsOf', () => {
  it('returns the effective version with the log truncated at its head', () => {
    const slice = resolveAsOf(buildSummary([VERSION_1, VERSION_2, VERSION_DRAFT]), '2026-07-15T00:00:00.000Z');

    expect(slice?.version).toEqual(VERSION_2);
    // v2's head is index 3, so events 4 and 5 (written after it published) never reach
    // the fold — the state is folded from the truncated prefix.
    expect(slice?.state).toEqual({ foldedEventIds: [eventId(0), eventId(1), eventId(2), eventId(3)] });
  });

  it('resolves an older version when the clock predates the newer publish', () => {
    const slice = resolveAsOf(buildSummary([VERSION_1, VERSION_2, VERSION_DRAFT]), '2026-04-01T00:00:00.000Z');

    expect(slice?.version).toEqual(VERSION_1);
    expect(slice?.state).toEqual({ foldedEventIds: [eventId(0), eventId(1)] });
  });

  it('ignores a publish scheduled to take effect in the future', () => {
    // v3 is already published (06-01) but not effective until 09-01 — a render on 07-15 must still
    // resolve v2, which is why selection keys on effectiveFrom rather than publishedAt.
    const slice = resolveAsOf(buildSummary([VERSION_1, VERSION_2, VERSION_3_SCHEDULED]), '2026-07-15T00:00:00.000Z');

    expect(slice?.version).toEqual(VERSION_2);
  });

  it('returns null when nothing is effective yet', () => {
    const slice = resolveAsOf(buildSummary([VERSION_1, VERSION_2, VERSION_DRAFT]), '2026-02-01T00:00:00.000Z');

    expect(slice).toBeNull();
  });

  it('returns null when the doc has only an unpublished draft', () => {
    const slice = resolveAsOf(buildSummary([VERSION_DRAFT]), '2026-07-15T00:00:00.000Z');

    expect(slice).toBeNull();
  });

  it('returns null for a soft-deleted doc', () => {
    const slice = resolveAsOf(buildSummary([VERSION_1, VERSION_2], '2026-06-01T00:00:00.000Z' as QpqIsoDateTime), '2026-07-15T00:00:00.000Z');

    expect(slice).toBeNull();
  });

  it('returns null for a missing doc', () => {
    expect(resolveAsOf(null, '2026-07-15T00:00:00.000Z')).toBeNull();
  });
});

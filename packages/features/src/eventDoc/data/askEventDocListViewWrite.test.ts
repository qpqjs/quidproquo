import {
  askKeyValueStoreUpdateBase,
  KeyValueStoreActionType,
  kvsLessThan,
  kvsLessThanOrEqual,
  kvsNotExists,
  kvsOr,
  KvsUpdate,
  KvsUpdateActionType,
  QpqIsoDateTime,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { EventDocListViewState } from '../models';
import { askEventDocListViewWrite, EventDocListViewWriteOptions } from './askEventDocListViewWrite';

// A list view row is a projection two writers race for (the append path and the stream projector), so the write itself
// carries the ordering guard: only land over a missing row or an older one. The projector folded under the acceptance
// rules, so it alone may replace a row at the same event.

const STATE: EventDocListViewState & { status: string } = {
  id: 'doc-1',
  updatedAt: '2026-10-14T00:00:01.000Z' as QpqIsoDateTime,
  status: 'sent',
};

type UpdatePayload = { keyValueStoreName: string; key: unknown; sortKey?: unknown; updates: KvsUpdate; options?: { condition?: unknown } };

const write = (onUpdate: (payload: UpdatePayload) => unknown, state: EventDocListViewState = STATE, options?: EventDocListViewWriteOptions) =>
  runStory(
    askEventDocStoreProvide(
      buildEventDocStore({ storeName: 'envelopes', type: 'envelope' }),
      askEventDocListViewWrite('doc-1', 'overview', 7, state, options),
    ),
    {
      [KeyValueStoreActionType.Update]: (action: { payload: UpdatePayload }) => onUpdate(action.payload),
    },
  );

describe('askEventDocListViewWrite', () => {
  it('writes the state nested under the view and type key, with the fields the list sorts and filters on copied out', () => {
    let payload: UpdatePayload | undefined;

    const written = write((p) => {
      payload = p;
      return {};
    });

    expect(written).toBe(true);
    expect(payload?.keyValueStoreName).toBe(eventDocListsStoreName('envelopes'));
    expect(payload?.key).toBe('overview#envelope');
    expect(payload?.sortKey).toBe('doc-1');
    expect(payload?.updates).toContainEqual({ attributePath: 'state', action: KvsUpdateActionType.Set, value: STATE });
    expect(payload?.updates).toContainEqual({ attributePath: 'updatedAt', action: KvsUpdateActionType.Set, value: STATE.updatedAt });
    expect(payload?.updates).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 7 });
  });

  it('removes a stale deletedAt for a live document and sets it for a deleted one', () => {
    const updates: KvsUpdate[] = [];
    const capture = (p: UpdatePayload) => {
      updates.push(p.updates);
      return {};
    };

    write(capture);
    write(capture, { ...STATE, deletedAt: '2026-10-15T00:00:00.000Z' as QpqIsoDateTime });

    expect(updates[0]).toContainEqual({ attributePath: 'deletedAt', action: KvsUpdateActionType.Remove });
    expect(updates[1]).toContainEqual({ attributePath: 'deletedAt', action: KvsUpdateActionType.Set, value: '2026-10-15T00:00:00.000Z' });
  });

  it('lands only over an older row, unless the writer is the projector, which may replace a row at the same event', () => {
    const conditions: unknown[] = [];
    const capture = (p: UpdatePayload) => {
      conditions.push(p.options?.condition);
      return {};
    };

    write(capture);
    write(capture, STATE, { authoritative: true });

    expect(conditions[0]).toEqual(kvsOr([kvsNotExists('eventId'), kvsLessThan('eventId', 7)]));
    expect(conditions[1]).toEqual(kvsOr([kvsNotExists('eventId'), kvsLessThanOrEqual('eventId', 7)]));
  });

  it('reports a refused write as false rather than failing', () => {
    const written = write(() => throwsError(askKeyValueStoreUpdateBase.errorType.ConditionFailed, 'newer row stored'));

    expect(written).toBe(false);
  });

  it('rethrows any other failure', () => {
    expect(() => write(() => throwsError(askKeyValueStoreUpdateBase.errorType.Throttled, 'throttled'))).toThrow(/throttled/);
  });
});

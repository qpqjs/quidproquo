import { DynamicFunctionsActionType, KeyValueStoreActionType, QpqIsoDateTime } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { EventDocEffect, EventDocEvent } from '../models';
import { foldEventDocSummary } from '../summary';
import { askEventDocReprojectDocument } from './askEventDocReprojectDocument';

// One message of a reproject: the projector re-run at one document's head, under the scope the document lives in and
// through the fold its doc type registered, as the stream projector would have done for its newest event.

const STORE = 'envelopes';
const EVENTS_STORE = eventDocEventsStoreName(STORE);

const event = (type: string, eventId: number, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `msg-${eventId}`,
      createdBy: { userId: 'user-1', userDisplayName: 'User One' },
      createdAt: `2026-11-16T00:00:0${eventId}.000Z` as QpqIsoDateTime,
      eventId,
    },
  },
});

const LOG = [
  event(EventDocEffect.InitState, 0, { id: 'doc-1', code: 'lease', name: 'Lease' }),
  event(EventDocEffect.SetName, 1, { name: 'Renamed' }),
];

type KvsPayload = { keyValueStoreName: string; key?: string; options?: { scope?: string; sortAscending?: boolean; limit?: number } };

const reproject = (options: { scope?: string; snapshotFunctions?: Record<string, string>; log?: EventDocEvent[] } = {}) => {
  const log = options.log ?? LOG;
  const scopes: (string | undefined)[] = [];
  const functionCalls: { dynamicFunctionsName: string; functionName: string }[] = [];
  const writes: { store: string; key?: string }[] = [];
  const deletes: KvsPayload[] = [];

  runStory(askEventDocReprojectDocument(STORE, { type: 'envelope', docId: 'doc-1', scope: options.scope }, options.snapshotFunctions ?? {}), {
    [DynamicFunctionsActionType.Execute]: (action: { payload: { dynamicFunctionsName: string; functionName: string; args: [EventDocEvent[]] } }) => {
      functionCalls.push(action.payload);
      if (action.payload.functionName === 'getSnapshotCacheKey') {
        return '';
      }
      if (action.payload.functionName === 'getListViewNames') {
        return ['summary'];
      }
      return { document: { schemaVersion: 1 }, summary: { ...foldEventDocSummary(action.payload.args[0]), name: 'from-fold' } };
    },
    [KeyValueStoreActionType.Query]: (action: { payload: KvsPayload }) => {
      const { keyValueStoreName, options: queryOptions } = action.payload;
      scopes.push(queryOptions?.scope);
      if (keyValueStoreName !== EVENTS_STORE) {
        return { items: [], nextPageKey: undefined };
      }
      const rows = log.map((e) => ({ pk: 'doc-1', sk: e.payload.metadata.eventId, type: 'envelope', data: e }));
      const ordered = queryOptions?.sortAscending === false ? [...rows].reverse() : rows;
      return { items: ordered.slice(0, queryOptions?.limit), nextPageKey: undefined };
    },
    [KeyValueStoreActionType.Update]: (action: { payload: KvsPayload }) => {
      scopes.push(action.payload.options?.scope);
      writes.push({ store: action.payload.keyValueStoreName, key: action.payload.key });
      return {};
    },
    [KeyValueStoreActionType.Upsert]: (action: { payload: KvsPayload }) => {
      scopes.push(action.payload.options?.scope);
      writes.push({ store: action.payload.keyValueStoreName });
      return undefined;
    },
    [KeyValueStoreActionType.Delete]: (action: { payload: KvsPayload }) => {
      deletes.push(action.payload);
      return undefined;
    },
  });

  return { scopes, functionCalls, writes, deletes };
};

describe('askEventDocReprojectDocument', () => {
  it("projects through the doc type's registered fold, writing its list view rows and a fresh snapshot set", () => {
    const { functionCalls, writes } = reproject({ snapshotFunctions: { envelope: 'envelopes-fold' } });

    expect(functionCalls.every((call) => call.dynamicFunctionsName === 'envelopes-fold')).toBe(true);
    expect(functionCalls.map((call) => call.functionName)).toContain('foldSnapshotViews');
    expect(writes).toContainEqual({ store: eventDocListsStoreName(STORE), key: 'summary#envelope' });
    expect(writes.filter((write) => write.store === eventDocSnapshotsStoreName(STORE))).toHaveLength(2);
  });

  it('runs every read and write under the scope the document lives in', () => {
    const { scopes } = reproject({ scope: 'TENANT#a', snapshotFunctions: { envelope: 'envelopes-fold' } });

    expect(scopes.length).toBeGreaterThan(0);
    expect(scopes.every((scope) => scope === 'TENANT#a')).toBe(true);
  });

  it('rebuilds only the summary, from the log, for a doc type with no registered fold', () => {
    const { functionCalls, writes } = reproject();

    expect(functionCalls.map((call) => call.functionName)).not.toContain('foldSnapshotViews');
    expect(writes).toEqual([{ store: eventDocListsStoreName(STORE), key: 'summary#envelope' }]);
  });

  it('removes the list view rows of a document whose log is gone', () => {
    const { writes, deletes } = reproject({ snapshotFunctions: { envelope: 'envelopes-fold' }, log: [] });

    expect(writes).toEqual([]);
    expect(deletes.map((payload) => [payload.keyValueStoreName, payload.key])).toEqual([[eventDocListsStoreName(STORE), 'summary#envelope']]);
  });
});

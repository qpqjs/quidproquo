import {
  DynamicFunctionsActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  KvsUpdate,
  KvsUpdateActionType,
  QpqIsoDateTime,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocEffect, EventDocEvent, EventDocSummary } from '../models';
import { foldEventDocSummary } from '../summary';
import { createKvsUpdateMock } from '../testing/kvsUpdateActionMock';
import { askEventDocProjectAtEvent } from './askEventDocProjectAtEvent';

// Two writers reach the same row, the append path's refold and the stream projector, and a stream batch can arrive after
// the append has already written a later event. The guard on the view's eventId is what keeps that ordering safe.

const DOC_ID = 'doc-1';
const STORE_NAME = 'templates';
const TYPE = 'template';
const EVENTS_STORE = eventDocEventsStoreName(STORE_NAME);
const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE_NAME);
const FUNCTIONS = eventDocFunctionsName(STORE_NAME, TYPE);

type Row = Record<string, unknown>;

const event = (type: string, eventId: number, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `msg-${eventId}`,
      createdBy: { userId: 'user-1', userDisplayName: 'User One' },
      createdAt: `2026-10-14T00:00:0${eventId}.000Z` as QpqIsoDateTime,
      eventId,
    },
  },
});

const LOG = [
  event(EventDocEffect.InitState, 0, { id: DOC_ID, code: 'tpl-1', name: 'Template One' }),
  event(EventDocEffect.SetName, 1, { name: 'Renamed' }),
];

const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (row: Row, op: KvsQueryOperation): boolean => {
  if (!isCondition(op)) {
    const logical = op as KvsLogicalOperator;
    const results = logical.conditions.map((c) => matches(row, c));
    return logical.operation === KvsLogicalOperatorType.And ? results.every(Boolean) : results.some(Boolean);
  }
  const actual = row[op.key] as number | string;
  const a = op.valueA as number | string;
  switch (op.operation) {
    case KvsQueryOperationType.Equal:
      return actual === a;
    case KvsQueryOperationType.LessThanOrEqual:
      return actual <= a;
    case KvsQueryOperationType.GreaterThan:
      return actual > a;
    case KvsQueryOperationType.Between:
      return actual >= a && actual <= (op.valueB as number | string);
    default:
      throw new Error(`Test KVS mock does not support operator: ${op.operation}`);
  }
};

const buildHarness = (seed: { summaryRow?: Row; snapshotRows?: Row[] } = {}) => {
  const tables: Record<string, Row[]> = {
    [EVENTS_STORE]: LOG.map((e) => ({ pk: DOC_ID, sk: e.payload.metadata.eventId, type: TYPE, data: e })),
    [STORE_NAME]: seed.summaryRow ? [seed.summaryRow] : [],
    [SNAPSHOTS_STORE]: seed.snapshotRows ?? [],
  };
  const foldCalls: string[] = [];
  const summaryUpdates: KvsUpdate[] = [];

  const mocks = {
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [EventDocEvent[]] } }) => {
      if (action.payload.functionName === 'getSnapshotCacheKey') {
        return '';
      }
      foldCalls.push(action.payload.functionName);
      return { document: { folded: action.payload.args[0].length }, summary: foldEventDocSummary(action.payload.args[0]) };
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      let items = (tables[keyValueStoreName] ?? []).filter((row) => matches(row, keyCondition));
      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => (Number(a.sk) - Number(b.sk)) * (options?.sortAscending === false ? -1 : 1));
      }
      return { items: options?.limit === undefined ? items : items.slice(0, options.limit), nextPageKey: undefined };
    },

    [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: Row } }) => {
      (tables[action.payload.keyValueStoreName] ??= []).push(action.payload.item);
      return undefined;
    },

    [KeyValueStoreActionType.Update]: (action: { payload: { keyValueStoreName: string; updates: KvsUpdate } }) => {
      summaryUpdates.push(action.payload.updates);
      return createKvsUpdateMock({ tableFor: (_scope, storeName) => (tables[storeName] ??= []), keyName: 'type', sortKeyName: 'id' })(
        action as never,
      );
    },
  };

  const project = (eventId: number) =>
    runStory(askEventDocProvideStore({ storeName: STORE_NAME, type: TYPE }, askEventDocProjectAtEvent(DOC_ID, eventId, FUNCTIONS)), mocks);

  return { project, tables, foldCalls, summaryUpdates };
};

const newerSummaryRow: Row = { ...foldEventDocSummary(LOG), type: TYPE, name: 'Newer still', eventId: 5 };

describe('askEventDocProjectAtEvent', () => {
  it('writes the summary at the event it folded through and returns the projected view', () => {
    const { project, tables, summaryUpdates } = buildHarness();

    const projected = project(1);

    expect(projected?.name).toBe('Renamed');
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect((tables[STORE_NAME][0] as EventDocSummary).eventId).toBe(1);
  });

  it('leaves a newer summary row alone but still files the snapshots and returns the view', () => {
    const { project, tables } = buildHarness({ summaryRow: newerSummaryRow });

    const projected = project(1);

    expect(projected?.name).toBe('Renamed');
    expect(tables[STORE_NAME][0]).toEqual(newerSummaryRow);
    expect(tables[SNAPSHOTS_STORE].map((row) => `${row.pk}@${row.sk}`).sort()).toEqual([`${DOC_ID}#document@1`, `${DOC_ID}#summary@1`]);
  });

  it('rewrites the summary from a seed already at the event without folding', () => {
    const seedSummary = foldEventDocSummary(LOG);
    const { project, foldCalls, summaryUpdates, tables } = buildHarness({
      snapshotRows: [
        { pk: `${DOC_ID}#document`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: { folded: 2 }, views: ['document', 'summary'] } },
        { pk: `${DOC_ID}#summary`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: seedSummary } },
      ],
    });

    const projected = project(1);

    expect(foldCalls).toEqual([]);
    expect(projected).toEqual(seedSummary);
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect((tables[STORE_NAME][0] as EventDocSummary).eventId).toBe(1);
  });

  it('rederives from the log when the seed summary does not parse, as one from before the view carried its event id', () => {
    const { eventId: _seedEventId, ...olderSummary } = foldEventDocSummary(LOG);
    const { project, summaryUpdates, tables } = buildHarness({
      snapshotRows: [
        { pk: `${DOC_ID}#document`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: { folded: 2 }, views: ['document', 'summary'] } },
        { pk: `${DOC_ID}#summary`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: olderSummary } },
      ],
    });

    const projected = project(1);

    expect(projected?.eventId).toBe(1);
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect((tables[STORE_NAME][0] as EventDocSummary).eventId).toBe(1);
  });
});

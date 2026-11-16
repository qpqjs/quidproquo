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
} from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { EventDocEffect, EventDocEvent, EventDocSummaryView } from '../models';
import { foldEventDocSummary } from '../summary';
import { buildEventDocSummaryRow } from '../testing/buildEventDocSummaryRow';
import { createKvsUpdateMock } from '../testing/kvsUpdateActionMock';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocProjectAtEvent } from './askEventDocProjectAtEvent';

// Two writers reach the same rows, the append path's refold and the stream projector, and a stream batch can arrive after
// the append has already written a later event. The guard on each row's eventId is what keeps that ordering safe, and
// the projector, having folded under the acceptance rules, replaces what the append path left at the same event.

const DOC_ID = 'doc-1';
const STORE_NAME = 'templates';
const TYPE = 'template';
const EVENTS_STORE = eventDocEventsStoreName(STORE_NAME);
const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE_NAME);
const LISTS_STORE = eventDocListsStoreName(STORE_NAME);
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

// What the collection's fold hands back for its declared `overview` list view.
const overviewOf = (events: EventDocEvent[]) => ({
  schemaVersion: 1,
  id: DOC_ID,
  updatedAt: events[events.length - 1]!.payload.metadata.createdAt,
  eventCount: events.length,
});

const buildHarness = (seed: { summaryRow?: Row; listRows?: Row[]; snapshotRows?: Row[]; listViewNames?: string[] } = {}) => {
  const tables: Record<string, Row[]> = {
    [EVENTS_STORE]: LOG.map((e) => ({ pk: DOC_ID, sk: e.payload.metadata.eventId, type: TYPE, data: e })),
    [LISTS_STORE]: [...(seed.summaryRow ? [seed.summaryRow] : []), ...(seed.listRows ?? [])],
    [SNAPSHOTS_STORE]: seed.snapshotRows ?? [],
  };
  const foldCalls: string[] = [];
  const summaryUpdates: KvsUpdate[] = [];

  const mocks = {
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [EventDocEvent[], Record<string, unknown>?] } }) => {
      if (action.payload.functionName === 'getSnapshotCacheKey') {
        return '';
      }
      if (action.payload.functionName === 'getListViewNames') {
        return ['summary', ...(seed.listViewNames ?? [])];
      }
      // Folding no events onto a seed is how the projector asks whether the seed still holds every view: the
      // definition hands the seed back, or null when a view it declares now is missing from it.
      const [events, seedViews] = action.payload.args;
      if (events.length === 0 && seedViews) {
        return (seed.listViewNames ?? []).every((viewName) => viewName in seedViews) ? seedViews : null;
      }
      foldCalls.push(action.payload.functionName);
      return {
        document: { schemaVersion: 1, folded: action.payload.args[0].length },
        summary: foldEventDocSummary(action.payload.args[0]),
        ...(seed.listViewNames?.includes('overview') ? { overview: overviewOf(action.payload.args[0]) } : {}),
      };
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
      return createKvsUpdateMock({ tableFor: (_scope, storeName) => (tables[storeName] ??= []), keyName: 'pk', sortKeyName: 'id' })(action as never);
    },
  };

  const project = (eventId: number) =>
    runStory(
      askEventDocStoreProvide(buildEventDocStore({ storeName: STORE_NAME, type: TYPE }), askEventDocProjectAtEvent(DOC_ID, eventId, FUNCTIONS)),
      mocks,
    );

  const rowOf = (viewName: string) => tables[LISTS_STORE]!.find((row) => row.pk === `${viewName}#${TYPE}`) as EventDocStoredListView | undefined;

  return { project, tables, foldCalls, summaryUpdates, rowOf };
};

const newerSummaryRow: Row = { ...buildEventDocSummaryRow(TYPE, { ...foldEventDocSummary(LOG), name: 'Newer still' }, 5) };

describe('askEventDocProjectAtEvent', () => {
  it('writes the summary at the event it folded through and returns the projected view', () => {
    const { project, rowOf, summaryUpdates } = buildHarness();

    const projected = project(1);

    expect(projected?.name).toBe('Renamed');
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect(rowOf('summary')?.eventId).toBe(1);
    expect((rowOf('summary')?.state as EventDocSummaryView).name).toBe('Renamed');
  });

  it('replaces a summary row the append path left at the same event', () => {
    const appendPathRow = buildEventDocSummaryRow(TYPE, { ...foldEventDocSummary(LOG), name: 'Applied without the rules' }, 1);
    const { project, rowOf } = buildHarness({ summaryRow: { ...appendPathRow } });

    project(1);

    expect((rowOf('summary')?.state as EventDocSummaryView).name).toBe('Renamed');
  });

  it('writes a row for every declared list view beside the summary, from the same fold', () => {
    const { project, rowOf, tables } = buildHarness({ listViewNames: ['overview'] });

    project(1);

    expect(rowOf('overview')).toEqual({
      pk: `overview#${TYPE}`,
      id: DOC_ID,
      updatedAt: LOG[1]!.payload.metadata.createdAt,
      eventId: 1,
      state: overviewOf(LOG),
    });
    expect(tables[LISTS_STORE]).toHaveLength(2);
  });

  it('leaves a declared list view row that is already past the event alone', () => {
    const newerOverviewRow: Row = { pk: `overview#${TYPE}`, id: DOC_ID, updatedAt: '2026-10-14T00:00:09.000Z', eventId: 5, state: { id: DOC_ID } };
    const { project, rowOf } = buildHarness({ listViewNames: ['overview'], listRows: [{ ...newerOverviewRow }] });

    project(1);

    expect(rowOf('overview')).toEqual(newerOverviewRow);
  });

  it('leaves a newer summary row alone but still files the snapshots and returns the view', () => {
    const { project, tables } = buildHarness({ summaryRow: newerSummaryRow });

    const projected = project(1);

    expect(projected?.name).toBe('Renamed');
    expect(tables![LISTS_STORE]![0]).toEqual(newerSummaryRow);
    expect(tables![SNAPSHOTS_STORE]!.map((row) => `${row.pk}@${row.sk}`).sort()).toEqual([`${DOC_ID}#document@1`, `${DOC_ID}#summary@1`]);
  });

  it('rewrites the summary from a seed already at the event without folding', () => {
    const seedSummary = foldEventDocSummary(LOG);
    const { project, foldCalls, summaryUpdates, rowOf } = buildHarness({
      snapshotRows: [
        {
          pk: `${DOC_ID}#document`,
          sk: 1,
          type: TYPE,
          data: { type: 'inline', snapshot: { schemaVersion: 1, folded: 2 }, views: ['document', 'summary'] },
        },
        { pk: `${DOC_ID}#summary`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: seedSummary } },
      ],
    });

    const projected = project(1);

    expect(foldCalls).toEqual([]);
    expect(projected).toEqual(seedSummary);
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect(rowOf('summary')?.eventId).toBe(1);
  });

  it('folds from scratch when a seed already at the event lacks a view the definition declares now', () => {
    const { project, foldCalls, rowOf } = buildHarness({
      listViewNames: ['overview'],
      snapshotRows: [
        {
          pk: `${DOC_ID}#document`,
          sk: 1,
          type: TYPE,
          data: { type: 'inline', snapshot: { schemaVersion: 1, folded: 2 }, views: ['document', 'summary'] },
        },
        { pk: `${DOC_ID}#summary`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: foldEventDocSummary(LOG) } },
      ],
    });

    project(1);

    // The seed was written before `overview` existed, so the document is folded again and the new view gets its row.
    expect(foldCalls).toEqual(['foldSnapshotViews']);
    expect(rowOf('overview')).toMatchObject({ eventId: 1, state: overviewOf(LOG) });
  });

  it('folds from scratch when the seed holds a summary from before it was an ordinary view, with no schema version', () => {
    const { schemaVersion: _seedSchemaVersion, ...olderSummary } = foldEventDocSummary(LOG);
    const { project, summaryUpdates, rowOf, foldCalls } = buildHarness({
      snapshotRows: [
        {
          pk: `${DOC_ID}#document`,
          sk: 1,
          type: TYPE,
          data: { type: 'inline', snapshot: { schemaVersion: 1, folded: 2 }, views: ['document', 'summary'] },
        },
        { pk: `${DOC_ID}#summary`, sk: 1, type: TYPE, data: { type: 'inline', snapshot: olderSummary } },
      ],
    });

    const projected = project(1);

    // The seed is passed over, so the whole prefix is folded and nothing resumes from the old shape.
    expect(foldCalls).toEqual(['foldSnapshotViews']);
    expect(projected?.eventId).toBe(1);
    expect(summaryUpdates[0]).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 1 });
    expect(rowOf('summary')?.eventId).toBe(1);
  });
});

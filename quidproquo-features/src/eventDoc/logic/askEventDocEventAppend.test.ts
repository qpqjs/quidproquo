import {
  askKeyValueStoreUpdateBase,
  DateActionType,
  DynamicFunctionsActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  kvsLessThan,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  kvsNotExists,
  kvsOr,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  LogActionType,
  LogLevelEnum,
  QpqIsoDateTime,
  runStory,
  throwsError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocStoreOptions } from '../context/buildEventDocStore';
import { EventDocEffect, EventDocEvent, EventDocEventActor, EventDocEventInput, EventDocSummary } from '../models';
import { foldEventDocSummary } from '../summary';
import { createKvsUpdateMock } from '../testing/kvsUpdateActionMock';
import { askEventDocEventAppend } from './askEventDocEventAppend';

// The summary row is what every "which version is in effect" read answers from, and the stream projector rebuilds it
// only after an append returns. So a reserved lifecycle append must leave the row current before it returns, folded in
// process through the summary reducer, while a domain append still leaves the row to the projector.

const DOC_ID = 'doc-1';
const STORE: EventDocStoreOptions = { storeName: 'templates', type: 'template' };
const EVENTS_STORE = eventDocEventsStoreName(STORE.storeName);
const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE.storeName);
const ACTOR: EventDocEventActor = { userId: 'user-1', userDisplayName: 'User One' };
const T0 = '2026-10-14T00:00:00.000Z' as QpqIsoDateTime;

type Row = Record<string, unknown>;

const event = (type: string, eventId: number, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: { version: 1, clientMessageId: `msg-${eventId}`, createdBy: ACTOR, createdAt: T0, eventId },
  },
});

const INIT = event(EventDocEffect.InitState, 0, { id: DOC_ID, code: 'tpl-1', name: 'Template One' });

const input = (type: string, data: unknown = {}): EventDocEventInput => ({
  type,
  payload: { data, metadata: { version: 1, clientMessageId: `msg-${type}` } },
});

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
    case KvsQueryOperationType.LessThan:
      return actual < a;
    case KvsQueryOperationType.LessThanOrEqual:
      return actual <= a;
    case KvsQueryOperationType.GreaterThan:
      return actual > a;
    case KvsQueryOperationType.GreaterThanOrEqual:
      return actual >= a;
    case KvsQueryOperationType.Between:
      return actual >= a && actual <= (op.valueB as number | string);
    default:
      throw new Error(`Test KVS mock does not support operator: ${op.operation}`);
  }
};

type Harness = {
  // Events already in the log that the projector has not folded into the row yet.
  unprojected?: EventDocEvent[];
  // The row as a projector from before the view carried `eventId` left it.
  rowWithoutEventId?: boolean;
  rowEventId?: number;
  summaryWriteFails?: boolean;
};

const buildHarness = (options: Harness = {}) => {
  const tables: Record<string, Row[]> = {};
  const sequence: string[] = [];
  const summaryUpdates: { updates: unknown; condition: unknown }[] = [];
  const hookPayloads: { summary: EventDocSummary }[] = [];
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  let clock = Date.parse(T0);

  const log = [INIT, ...(options.unprojected ?? [])];
  tables[EVENTS_STORE] = log.map((e) => ({ pk: DOC_ID, sk: e.payload.metadata.eventId, type: STORE.type, data: e }));

  const row: Row = { ...foldEventDocSummary([INIT]), type: STORE.type };
  if (options.rowWithoutEventId) {
    delete row.eventId;
  }
  if (options.rowEventId !== undefined) {
    row.eventId = options.rowEventId;
  }
  tables[STORE.storeName] = [row];

  const mocks = {
    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),

    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
    },

    // Only the hooks' state derivation reaches the registered functions; the refold itself never does.
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [EventDocEvent[]] } }) => {
      sequence.push(`fn:${action.payload.functionName}`);
      if (action.payload.functionName === 'getSnapshotCacheKey') {
        return '';
      }
      if (action.payload.functionName === 'foldDocumentState') {
        return { foldedEventIds: action.payload.args[0].map((e) => e.payload.metadata.eventId) };
      }
      throw new Error(`Unexpected dynamic function: ${action.payload.functionName}`);
    },

    [InlineFunctionActionType.Execute]: (action: { payload: { payload: { summary: EventDocSummary } } }) => {
      sequence.push('hook');
      hookPayloads.push(action.payload.payload);
      return undefined;
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options: queryOptions } = action.payload;
      let items = (tables[keyValueStoreName] ?? []).filter((r) => matches(r, keyCondition));
      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => (Number(a.sk) - Number(b.sk)) * (queryOptions?.sortAscending === false ? -1 : 1));
      }
      return { items: queryOptions?.limit === undefined ? items : items.slice(0, queryOptions.limit), nextPageKey: undefined };
    },

    [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: Row } }) => {
      const { keyValueStoreName, item } = action.payload;
      sequence.push(`upsert:${keyValueStoreName}`);
      (tables[keyValueStoreName] ??= []).push(item);
      return undefined;
    },

    [KeyValueStoreActionType.Update]: (action: { payload: { keyValueStoreName: string; updates: unknown; options?: { condition?: unknown } } }) => {
      sequence.push(`update:${action.payload.keyValueStoreName}`);
      summaryUpdates.push({ updates: action.payload.updates, condition: action.payload.options?.condition });
      if (options.summaryWriteFails) {
        return throwsError(askKeyValueStoreUpdateBase.errorType.ServiceUnavailable, 'throttled');
      }
      return createKvsUpdateMock({ tableFor: (_scope, storeName) => (tables[storeName] ??= []), keyName: 'type', sortKeyName: 'id' })(
        action as never,
      );
    },
  };

  const append = (next: EventDocEventInput, store: EventDocStoreOptions = STORE) =>
    runStory(askEventDocProvideStore(store, askEventDocEventAppend(DOC_ID, next, ACTOR, { validate: false })), mocks);

  const summaryRow = () => tables[STORE.storeName][0] as EventDocSummary;
  const snapshotRows = () => tables[SNAPSHOTS_STORE] ?? [];

  return { append, summaryRow, snapshotRows, sequence, summaryUpdates, hookPayloads, logs };
};

describe('askEventDocEventAppend', () => {
  it('a Publish append writes the published version to the summary row before it returns, with no projection', () => {
    const { append, summaryRow, snapshotRows, summaryUpdates, sequence } = buildHarness();

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRow().versions[0].publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(1);
    expect(summaryUpdates).toHaveLength(1);
    expect(summaryUpdates[0].condition).toEqual(kvsOr([kvsNotExists('eventId'), kvsLessThan('eventId', 1)]));
    expect(snapshotRows()).toHaveLength(0);
    expect(sequence.filter((step) => step.startsWith('fn:'))).toEqual([]);
  });

  it('a Delete append writes deletedAt before it returns', () => {
    const { append, summaryRow } = buildHarness();

    append(input(EventDocEffect.Delete, undefined));

    expect(summaryRow().deletedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(1);
  });

  it('carries the row through the events the projector has not folded yet', () => {
    const { append, summaryRow } = buildHarness({
      unprojected: [event('SET_BODY', 1, { body: 'draft text' }), event(EventDocEffect.SetName, 2, { name: 'Renamed while drafting' })],
    });

    append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(summaryRow().name).toBe('Renamed while drafting');
    expect(summaryRow().versions[0].publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(3);
  });

  it('refolds the whole log for a row from before the view carried its event id', () => {
    const { append, summaryRow } = buildHarness({ rowWithoutEventId: true, unprojected: [event(EventDocEffect.SetName, 1, { name: 'Renamed' })] });

    append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(summaryRow().name).toBe('Renamed');
    expect(summaryRow().versions[0].publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(2);
  });

  it('leaves a row already past the event alone', () => {
    const { append, summaryRow } = buildHarness({ rowEventId: 5 });

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRow().eventId).toBe(5);
    expect(summaryRow().versions[0].publishedAt).toBeUndefined();
  });

  it('hands the refolded summary to the hooks, after the row is written', () => {
    const { append, sequence, hookPayloads } = buildHarness();

    append(input(EventDocEffect.Publish, { effectiveFrom: T0 }), { ...STORE, onPublish: 'syncRecord' });

    expect(hookPayloads).toHaveLength(1);
    expect(hookPayloads[0].summary.versions[0].publishedAt).toBeDefined();
    expect(sequence.indexOf(`update:${STORE.storeName}`)).toBeLessThan(sequence.indexOf('hook'));
  });

  it('a domain append leaves the summary row to the stream projector', () => {
    const { append, summaryRow, summaryUpdates } = buildHarness();

    append(input('SET_BODY', { body: 'hello' }));

    expect(summaryUpdates).toHaveLength(0);
    expect(summaryRow().eventId).toBe(0);
  });

  it('logs and still returns the event when the row cannot be written', () => {
    const { append, summaryRow, logs } = buildHarness({ summaryWriteFails: true });

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRow().eventId).toBe(0);
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Warn, msg: expect.stringContaining(DOC_ID), data: expect.anything() }]);
  });
});

import {
  askDynamicFunctionExecute,
  askKeyValueStoreUpdateBase,
  DateActionType,
  DynamicFunctionsActionType,
  ErrorTypeEnum,
  GuidActionType,
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
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import {
  EventDocEffect,
  EventDocEvent,
  EventDocEventActor,
  EventDocEventInput,
  EventDocEventOrigin,
  EventDocSummary,
  EventDocSummaryView,
} from '../models';
import { eventDocBaseFunctions, foldEventDocSummary } from '../summary';
import { buildEventDocSummaryRow } from '../testing/buildEventDocSummaryRow';
import { createKvsUpdateMock } from '../testing/kvsUpdateActionMock';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { EventDocStoreOptions } from '../types/EventDocStoreOptions';
import { askEventDocAppendServerEvent } from './askEventDocAppendServerEvent';
import { askEventDocEventAppend } from './askEventDocEventAppend';

// The summary row is what every "which version is in effect" read answers from, and a list reads the other list view
// rows; the stream projector rebuilds them only after an append returns. So every append leaves each row current
// before it returns, the summary through the same fold as any view the doc type declares.

const DOC_ID = 'doc-1';
const STORE: EventDocStoreOptions = { storeName: 'templates', type: 'template' };
const EVENTS_STORE = eventDocEventsStoreName(STORE.storeName);
const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE.storeName);
const LISTS_STORE = eventDocListsStoreName(STORE.storeName);
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
  // A document the lists store holds no summary row for.
  noSummaryRow?: boolean;
  rowEventId?: number;
  // The list views the registered definition declares, and the row an `overview` one already has.
  listViewNames?: string[];
  overviewRow?: Row;
  summaryWriteFails?: boolean;
  // Connections subscribed to this doc's head-moved topic on the 'ws' api.
  subscribers?: string[];
  signerSubscribers?: string[];
  pushFails?: boolean;
  // What the registered definition declares server-only; undefined registers no definition at all.
  serverEventTypes?: string[];
  // The registered validateEvent's verdict when a validated append runs it.
  verdict?: string;
};

const buildHarness = (options: Harness = {}) => {
  const tables: Record<string, Row[]> = {};
  const sequence: string[] = [];
  const summaryUpdates: { updates: unknown; condition: unknown }[] = [];
  const listViewFolds: { viewName: string; eventIds: number[]; seedState: unknown; trusted: boolean }[] = [];
  const hookPayloads: { summary: EventDocSummary }[] = [];
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  const pushes: { connectionId: string; payload: unknown }[] = [];
  let clock = Date.parse(T0);

  tables['qpq-wsq-subs-ws'] = (options.subscribers ?? []).map((connectionId) => ({ topic: `eventDoc#${STORE.storeName}#${DOC_ID}`, connectionId }));
  tables['qpq-wsq-subs-signws'] = (options.signerSubscribers ?? []).map((connectionId) => ({
    topic: `eventDoc#${STORE.storeName}#${DOC_ID}`,
    connectionId,
  }));

  const log = [INIT, ...(options.unprojected ?? [])];
  tables[EVENTS_STORE] = log.map((e) => ({ pk: DOC_ID, sk: e.payload.metadata.eventId, type: STORE.type, data: e }));

  tables[LISTS_STORE] = [
    ...(options.noSummaryRow ? [] : [{ ...buildEventDocSummaryRow(STORE.type, foldEventDocSummary([INIT]), options.rowEventId) }]),
    ...(options.overviewRow ? [options.overviewRow] : []),
  ];

  const mocks = {
    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),

    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
    },

    // The client gate, the hooks' state derivation and every list view's fold reach the registered functions.
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [EventDocEvent[]] } }) => {
      sequence.push(`fn:${action.payload.functionName}`);
      if (action.payload.functionName === 'getListViewNames') {
        return ['summary', ...(options.listViewNames ?? [])];
      }
      if (action.payload.functionName === 'foldListView') {
        const [viewName, events, seedState, trusted] = action.payload.args as unknown as [string, EventDocEvent[], unknown, boolean];
        // The summary folds for real, as a definition folds it; a declared view answers with a stand-in state.
        if (viewName === 'summary') {
          return eventDocBaseFunctions.foldListView(viewName, events, seedState, trusted);
        }
        listViewFolds.push({ viewName, eventIds: events.map((e) => e.payload.metadata.eventId), seedState, trusted });
        return { id: DOC_ID, updatedAt: events[events.length - 1]!.payload.metadata.createdAt, folded: events.length };
      }
      if (action.payload.functionName === 'getServerEventTypes') {
        return options.serverEventTypes === undefined
          ? throwsError(askDynamicFunctionExecute.errorType.DynamicFunctionsNotFound, 'no definition registered')
          : options.serverEventTypes;
      }
      if (action.payload.functionName === 'getSnapshotCacheKey') {
        return '';
      }
      if (action.payload.functionName === 'validateEvent') {
        return options.verdict ?? null;
      }
      if (action.payload.functionName === 'foldDocumentState') {
        return { foldedEventIds: action.payload.args[0].map((e) => e.payload.metadata.eventId) };
      }
      throw new Error(`Unexpected dynamic function: ${action.payload.functionName}`);
    },

    [GuidActionType.New]: () => 'server-guid',

    [InlineFunctionActionType.Execute]: (action: { payload: { payload: { summary: EventDocSummary } } }) => {
      sequence.push('hook');
      hookPayloads.push(action.payload.payload);
      return undefined;
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options: queryOptions } = action.payload;
      sequence.push(`query:${keyValueStoreName}`);
      let items = (tables[keyValueStoreName] ?? []).filter((r) => matches(r, keyCondition));
      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => (Number(a.sk) - Number(b.sk)) * (queryOptions?.sortAscending === false ? -1 : 1));
      }
      return { items: queryOptions?.limit === undefined ? items : items.slice(0, queryOptions.limit), nextPageKey: undefined };
    },

    [WebsocketActionType.SendMessage]: (action: { payload: { connectionId: string; payload: unknown } }) => {
      sequence.push('push');
      if (options.pushFails) {
        return throwsError(ErrorTypeEnum.GenericError, 'socket down');
      }
      pushes.push({ connectionId: action.payload.connectionId, payload: action.payload.payload });
      return undefined;
    },

    [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: Row } }) => {
      const { keyValueStoreName, item } = action.payload;
      sequence.push(`upsert:${keyValueStoreName}`);
      (tables[keyValueStoreName] ??= []).push(item);
      return undefined;
    },

    [KeyValueStoreActionType.Update]: (action: { payload: { keyValueStoreName: string; updates: unknown; options?: { condition?: unknown } } }) => {
      sequence.push(`update:${action.payload.keyValueStoreName}`);
      if ((action.payload as unknown as { key: string }).key.startsWith('summary#')) {
        summaryUpdates.push({ updates: action.payload.updates, condition: action.payload.options?.condition });
      }
      if (options.summaryWriteFails) {
        return throwsError(askKeyValueStoreUpdateBase.errorType.Throttled, 'throttled');
      }
      return createKvsUpdateMock({ tableFor: (_scope, storeName) => (tables[storeName] ??= []), keyName: 'pk', sortKeyName: 'id' })(action as never);
    },
  };

  const append = (next: EventDocEventInput, store: EventDocStoreOptions = STORE, origin?: EventDocEventOrigin) =>
    runStory(askEventDocStoreProvide(buildEventDocStore(store), askEventDocEventAppend(DOC_ID, next, ACTOR, { validate: false, origin })), mocks);

  const appendValidated = (next: EventDocEventInput) =>
    runStory(askEventDocStoreProvide(buildEventDocStore(STORE), askEventDocEventAppend(DOC_ID, next, ACTOR, { validate: true })), mocks);

  const appendServer = (type: string, validate?: boolean) =>
    runStory(askEventDocStoreProvide(buildEventDocStore(STORE), askEventDocAppendServerEvent(DOC_ID, type, {}, 1, ACTOR, { validate })), mocks);

  const rowOf = (viewName: string) =>
    tables[LISTS_STORE]!.find((row) => row.pk === `${viewName}#${STORE.type}`) as EventDocStoredListView | undefined;
  const summaryRow = () => rowOf('summary')!.state as EventDocSummaryView;
  const summaryRowEventId = () => rowOf('summary')!.eventId;
  const snapshotRows = () => tables[SNAPSHOTS_STORE] ?? [];
  const logRows = () => tables[EVENTS_STORE];

  return {
    append,
    appendValidated,
    appendServer,
    rowOf,
    summaryRow,
    summaryRowEventId,
    snapshotRows,
    logRows,
    sequence,
    summaryUpdates,
    listViewFolds,
    hookPayloads,
    logs,
    pushes,
  };
};

describe('askEventDocEventAppend', () => {
  it('a Publish append writes the published version to the summary row before it returns, with no projection', () => {
    const { append, summaryRow, snapshotRows, summaryUpdates, sequence } = buildHarness();

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRow!().versions[0]!.publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(1);
    expect(summaryUpdates).toHaveLength(1);
    expect(summaryUpdates![0]!.condition).toEqual(kvsOr([kvsNotExists('eventId'), kvsLessThan('eventId', 1)]));
    expect(snapshotRows()).toHaveLength(0);
    // Beyond the client gate, the definition is asked for its list views and folds the one it has, the summary.
    expect(sequence.filter((step) => step.startsWith('fn:'))).toEqual(['fn:getServerEventTypes', 'fn:getListViewNames', 'fn:foldListView']);
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
    expect(summaryRow!().versions[0]!.publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(3);
  });

  it('refolds the whole log for a document with no summary row yet', () => {
    const { append, summaryRow } = buildHarness({ noSummaryRow: true, unprojected: [event(EventDocEffect.SetName, 1, { name: 'Renamed' })] });

    append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(summaryRow().name).toBe('Renamed');
    expect(summaryRow!().versions[0]!.publishedAt).toBeDefined();
    expect(summaryRow().eventId).toBe(2);
  });

  it('leaves a row already past the event alone', () => {
    const { append, summaryRow, summaryRowEventId } = buildHarness({ rowEventId: 5 });

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRowEventId()).toBe(5);
    expect(summaryRow!().versions[0]!.publishedAt).toBeUndefined();
  });

  it('hands the refolded summary to the hooks, after the row is written', () => {
    const { append, sequence, hookPayloads } = buildHarness();

    append(input(EventDocEffect.Publish, { effectiveFrom: T0 }), { ...STORE, onPublish: 'syncRecord' });

    expect(hookPayloads).toHaveLength(1);
    expect(hookPayloads![0]!.summary.versions[0]!.publishedAt).toBeDefined();
    expect(sequence.indexOf(`update:${LISTS_STORE}`)).toBeLessThan(sequence.indexOf('hook'));
  });

  it('a domain append brings the summary row up to date too, without reading the log back', () => {
    const { append, summaryRow, summaryUpdates, sequence } = buildHarness();

    append(input('SET_BODY', { body: 'hello' }));

    expect(summaryUpdates).toHaveLength(1);
    expect(summaryRow().eventId).toBe(1);
    expect(summaryRow().updatedAt).toBe(new Date(Date.parse(T0) + 1000).toISOString());
    expect(sequence.filter((step) => step.startsWith('fn:'))).toEqual(['fn:getServerEventTypes', 'fn:getListViewNames', 'fn:foldListView']);
    // The one read of the log is the append resolving the head; the refold folds the event it has in hand.
    expect(sequence.filter((step) => step === `query:${EVENTS_STORE}`)).toHaveLength(1);
  });

  it('logs and still returns the event when the row cannot be written', () => {
    const { append, summaryRow, logs } = buildHarness({ summaryWriteFails: true });

    const appended = append(input(EventDocEffect.Publish, { effectiveFrom: T0 }));

    expect(appended.payload.metadata.eventId).toBe(1);
    expect(summaryRow().eventId).toBe(0);
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Warn, msg: expect.stringContaining(DOC_ID), data: expect.anything() }]);
  });
});

describe('askEventDocEventAppend declared list views', () => {
  const overviewRowAt = (eventId: number): Row => ({
    pk: `overview#${STORE.type}`,
    id: DOC_ID,
    updatedAt: T0,
    eventId,
    state: { id: DOC_ID, updatedAt: T0, folded: 1 },
  });

  it('folds the appended event onto the stored row and writes it back before returning', () => {
    const { append, rowOf, listViewFolds } = buildHarness({ listViewNames: ['overview'], overviewRow: overviewRowAt(0) });

    append(input('SET_BODY', { body: 'hello' }));

    // The row was right behind the append, so only the event in hand is folded, onto the row's own state.
    expect(listViewFolds).toEqual([{ viewName: 'overview', eventIds: [1], seedState: { id: DOC_ID, updatedAt: T0, folded: 1 }, trusted: false }]);
    expect(rowOf('overview')).toMatchObject({ eventId: 1, state: { id: DOC_ID, folded: 1 } });
  });

  it('folds the event as trusted when the append validated it', () => {
    const { appendValidated, listViewFolds } = buildHarness({ listViewNames: ['overview'], overviewRow: overviewRowAt(0), serverEventTypes: [] });

    appendValidated(input('SET_BODY', { body: 'hello' }));

    expect(listViewFolds[0]?.trusted).toBe(true);
  });

  it('reads the gap from the log for a row that is further behind, and never trusts what it read', () => {
    const { appendValidated, rowOf, listViewFolds } = buildHarness({
      listViewNames: ['overview'],
      overviewRow: overviewRowAt(0),
      unprojected: [event('SET_BODY', 1, { body: 'earlier' })],
      serverEventTypes: [],
    });

    appendValidated(input('SET_BODY', { body: 'hello' }));

    expect(listViewFolds[0]).toMatchObject({ eventIds: [1, 2], trusted: false });
    expect(rowOf('overview')?.eventId).toBe(2);
  });

  it('folds from the start of the log for a document with no row for the view', () => {
    const { append, rowOf, listViewFolds } = buildHarness({ listViewNames: ['overview'] });

    append(input('SET_BODY', { body: 'hello' }));

    expect(listViewFolds[0]).toMatchObject({ eventIds: [0, 1], seedState: null });
    expect(rowOf('overview')?.eventId).toBe(1);
  });

  it('leaves a row already past the event alone', () => {
    const { append, rowOf, listViewFolds } = buildHarness({ listViewNames: ['overview'], overviewRow: overviewRowAt(5) });

    append(input('SET_BODY', { body: 'hello' }));

    expect(listViewFolds).toEqual([]);
    expect(rowOf('overview')?.eventId).toBe(5);
  });
});

describe('askEventDocEventAppend server-only event types', () => {
  const SERVER_ONLY = 'SET_BUILD';

  it('refuses a client append of a server-only type with Forbidden, before anything is written', () => {
    const { append, logRows, sequence } = buildHarness({ serverEventTypes: [SERVER_ONLY] });

    expect(() => append(input(SERVER_ONLY))).toThrow(/server-only/);
    expect(logRows()).toHaveLength(1);
    expect(sequence.filter((step) => step.startsWith('upsert:') || step.startsWith('update:'))).toEqual([]);
  });

  it('still accepts a client append of any other type on the same collection', () => {
    const { append, logRows } = buildHarness({ serverEventTypes: [SERVER_ONLY] });

    expect(append(input('SET_BODY', { body: 'x' })).payload.metadata.eventId).toBe(1);
    expect(logRows()).toHaveLength(2);
  });

  it('a caller that names no origin is treated as a client', () => {
    const { append } = buildHarness({ serverEventTypes: [SERVER_ONLY] });

    expect(() => append(input(SERVER_ONLY), STORE, undefined)).toThrow(/server-only/);
  });

  it('a server-origin append writes the server-only type', () => {
    const { append, logRows } = buildHarness({ serverEventTypes: [SERVER_ONLY] });

    expect(append(input(SERVER_ONLY), STORE, EventDocEventOrigin.server).type).toBe(SERVER_ONLY);
    expect(logRows()).toHaveLength(2);
  });

  it('askEventDocAppendServerEvent writes the server-only type', () => {
    const { appendServer, logRows } = buildHarness({ serverEventTypes: [SERVER_ONLY] });

    expect(appendServer(SERVER_ONLY).payload.metadata.eventId).toBe(1);
    expect(logRows()).toHaveLength(2);
  });

  it('a collection with no registered definition declares no server-only types', () => {
    const { append, logRows } = buildHarness();

    expect(append(input(SERVER_ONLY)).type).toBe(SERVER_ONLY);
    expect(logRows()).toHaveLength(2);
  });
});

describe('askEventDocAppendServerEvent validation', () => {
  it('skips the domain rules by default: the event is written even when the rules would reject it', () => {
    const { appendServer, logRows, sequence } = buildHarness({ serverEventTypes: [], verdict: 'only on a draft' });

    appendServer('SET_BUILD');

    expect(logRows()).toHaveLength(2);
    expect(sequence).not.toContain('fn:validateEvent');
  });

  it('with validate, a rejected event throws Invalid and nothing is written', () => {
    const { appendServer, logRows } = buildHarness({ serverEventTypes: [], verdict: 'only on a draft' });

    expect(() => appendServer('SET_BUILD', true)).toThrow(/only on a draft/);
    expect(logRows()).toHaveLength(1);
  });

  it('with validate, an accepted event is written after the rules ran', () => {
    const { appendServer, logRows, sequence } = buildHarness({ serverEventTypes: [] });

    expect(appendServer('SET_BUILD', true).payload.metadata.eventId).toBe(1);
    expect(logRows()).toHaveLength(2);
    expect(sequence).toContain('fn:validateEvent');
  });
});

describe('askEventDocEventAppend head-moved push', () => {
  const SYNCED: EventDocStoreOptions = { ...STORE, syncWebsocketApiName: 'ws' };

  it('pushes the new head to every subscriber of the document after the hooks, ids only', () => {
    const harness = buildHarness({ subscribers: ['c1', 'c2'] });

    const appended = harness.append(input('template/rename', { name: 'Renamed' }), { ...SYNCED, onAppend: 'afterAppend' });

    expect(harness.sequence.filter((step) => step === 'hook' || step === 'push')).toEqual(['hook', 'push', 'push']);
    expect(harness.pushes.map((push) => push.connectionId)).toEqual(['c1', 'c2']);
    expect(harness!.pushes[0]!.payload).toMatchObject({
      type: 'Qpq/WebSocketQueue/EventDocHeadMoved',
      payload: {
        storeName: STORE.storeName,
        type: STORE.type,
        docId: DOC_ID,
        headEventId: 1,
        clientMessageId: appended.payload.metadata.clientMessageId,
      },
    });
  });

  it('pushes to every queue the collection syncs to', () => {
    const harness = buildHarness({ subscribers: ['c1'], signerSubscribers: ['s1', 's2'] });

    harness.append(input('template/rename', { name: 'Renamed' }), { ...STORE, syncWebsocketApiName: ['ws', 'signws'] });

    expect(harness.pushes.map((push) => push.connectionId)).toEqual(['c1', 's1', 's2']);
  });

  it('pushes nothing for a collection without sync', () => {
    const harness = buildHarness({ subscribers: ['c1'] });

    harness.append(input('template/rename', { name: 'Renamed' }));

    expect(harness.pushes).toEqual([]);
  });

  it('still returns the event when the push fails', () => {
    const harness = buildHarness({ subscribers: ['c1'], pushFails: true });

    const appended = harness.append(input('template/rename', { name: 'Renamed' }), SYNCED);

    expect(appended.payload.metadata.eventId).toBe(1);
  });
});

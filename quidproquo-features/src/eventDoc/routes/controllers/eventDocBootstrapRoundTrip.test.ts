import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  FileActionType,
  GuidActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  runStory,
  throwsError,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_EVENTS_STORE_NAME_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
  EVENT_DOC_USER_DIRECTORY_GLOBAL,
} from '../../constants/eventDocGlobalNames';
import { buildEventDocStore } from '../../context/buildEventDocStore';
import { EventDocEvent } from '../../models';
import { createKvsUpdateMock } from '../../testing/kvsUpdateActionMock';
import { eventDocSnapshotPk } from '../../types/EventDocStoredSnapshot';
import { appendEvent } from './appendEvent';
import { create } from './create';
import { listEvents } from './listEvents';

// Proves the bootstrap shape of listEvents (?includeBase=true) round-trips through a
// key-value store: the newest usable document-view snapshot comes back as the fold base
// with only the events after it, every unusable-base case (no snapshot, snapshot newer
// than the whole log, unreadable offloaded blob) degrades in-band to base: null with the
// full log, and the plain shape is untouched.

const store = buildEventDocStore({ storeName: 'test-docs', type: 'testDoc' });

const globals: Record<string, string> = {
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'test-user-directory',
};

// Generic evaluator for the operators this flow issues. Sort keys are the numeric event
// ids, so ordering operators compare numerically — exactly the contract the real store
// honours.
const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (item: Record<string, unknown>, op: KvsQueryOperation): boolean => {
  if (isCondition(op)) {
    const actual = item[op.key];
    switch (op.operation) {
      case KvsQueryOperationType.Equal:
        return actual === op.valueA;
      case KvsQueryOperationType.GreaterThan:
        return typeof actual === 'number' && typeof op.valueA === 'number' && actual > op.valueA;
      case KvsQueryOperationType.LessThanOrEqual:
        return typeof actual === 'number' && typeof op.valueA === 'number' && actual <= op.valueA;
      default:
        throw new Error(`Test KVS mock does not support operator: ${op.operation}`);
    }
  }

  const logical = op as KvsLogicalOperator;
  if (logical.operation === KvsLogicalOperatorType.And) {
    return logical.conditions.every((c) => matches(item, c));
  }
  throw new Error(`Test KVS mock does not support logical operator: ${logical.operation}`);
};

const buildMocks = () => {
  const tables: Record<string, Record<string, unknown>[]> = {};
  let guidCounter = 0;
  let clock = Date.parse('2026-08-01T00:00:00.000Z');

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',

    // No functions object registered for this collection: the append's pre-write gate
    // and any state read fall back exactly as an unregistered collection does.
    [DynamicFunctionsActionType.Execute]: throwsError(
      DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound,
      'Dynamic functions not found (test collection registers none)',
    ),

    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe', exp: 0, userDirectory: 'test-user-directory', wasValid: true },

    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),
    [GuidActionType.New]: () => `guid-${++guidCounter}`,

    // Every offloaded-blob read fails: the storageDrive snapshot case must degrade to a
    // from-scratch fold, never to a folded-from-nothing document.
    [FileActionType.ReadTextContents]: () => throwsError('NotFound', 'no blob in this test'),

    [KeyValueStoreActionType.Update]: createKvsUpdateMock({
      tableFor: (_scope, storeName) => (tables[storeName] ??= []),
      keyName: 'type',
      sortKeyName: 'id',
    }),

    [KeyValueStoreActionType.Upsert]: (action: {
      payload: { keyValueStoreName: string; item: Record<string, unknown>; options?: { ifNotExists?: boolean } };
    }) => {
      const { keyValueStoreName, item, options } = action.payload;
      const table = (tables[keyValueStoreName] ??= []);

      const sameRow = (row: Record<string, unknown>) =>
        'pk' in item && 'sk' in item ? row.pk === item.pk && row.sk === item.sk : row.id === item.id;

      const existingIndex = table.findIndex(sameRow);

      if (options?.ifNotExists && existingIndex >= 0) {
        return throwsError(askKeyValueStoreUpsertBase.errorType.Conflict, `Item already exists in ${keyValueStoreName}`);
      }

      if (existingIndex >= 0) {
        table[existingIndex] = item;
      } else {
        table.push(item);
      }

      return undefined;
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      const table = tables[keyValueStoreName] ?? [];

      let items = table.filter((item) => matches(item, keyCondition));

      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => (Number(a.sk) - Number(b.sk)) * (options?.sortAscending === false ? -1 : 1));
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return { items, nextPageKey: undefined };
    },
  };

  return { mocks, tables };
};

const httpEvent = (body: unknown, query: Record<string, string> = {}): HTTPEvent => ({
  path: '/test-docs',
  query,
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

const eventIdOf = (event: EventDocEvent): number => event.payload.metadata.eventId;

// A created doc with four appended events: [INIT_STATE, changed x4].
const seedDocWithEvents = (mocks: ReturnType<typeof buildMocks>['mocks']) => {
  const createResponse = runStory(create(httpEvent({ name: 'doc', code: 'guid-1' })), mocks);
  expect(createResponse.status).toBe(200);
  const docId = JSON.parse(createResponse.body!).id as string;

  for (let index = 1; index <= 4; index += 1) {
    const appendResponse = runStory(
      appendEvent(
        httpEvent({
          type: 'changed',
          payload: { data: { value: index }, metadata: { version: 1, clientMessageId: `client-msg-${index}` } },
        }),
        { id: docId },
      ),
      mocks,
    );
    expect(appendResponse.status).toBe(200);
  }

  return docId;
};

const listEventsPage = (mocks: ReturnType<typeof buildMocks>['mocks'], docId: string, query: Record<string, string> = {}) => {
  const response = runStory(listEvents(httpEvent(undefined, query), { id: docId }), mocks);
  expect(response.status).toBe(200);
  return JSON.parse(response.body!);
};

describe('eventDoc bootstrap round trip (listEvents ?includeBase=true)', () => {
  it('returns base: null and the whole log when no snapshot exists', () => {
    const { mocks } = buildMocks();
    const docId = seedDocWithEvents(mocks);

    const page = listEventsPage(mocks, docId, { includeBase: 'true' });

    expect(page.base).toBeNull();
    expect(page.items).toHaveLength(5);
    expect(page.items[0].type).toBe('INIT_STATE');
  });

  it('returns the newest snapshot as the base with only the events after it', () => {
    const { mocks, tables } = buildMocks();
    const docId = seedDocWithEvents(mocks);

    const fullLog = listEventsPage(mocks, docId).items as EventDocEvent[];
    const snapshotAt = eventIdOf(fullLog[2]);
    const snapshotState = { id: docId, folded: 'up-to-third-event' };

    tables[store.snapshotsStoreName] = [
      {
        pk: eventDocSnapshotPk(docId, 'document'),
        sk: snapshotAt,
        type: store.type,
        data: { type: 'inline', snapshot: snapshotState, views: ['document'] },
      },
    ];

    const page = listEventsPage(mocks, docId, { includeBase: 'true' });

    expect(page.base).toEqual({ eventId: snapshotAt, state: snapshotState });
    expect(page.items.map(eventIdOf)).toEqual(fullLog.slice(3).map(eventIdOf));
  });

  it('ignores a snapshot newer than every event in the log (stale snapshot row after an overwrite)', () => {
    const { mocks, tables } = buildMocks();
    const docId = seedDocWithEvents(mocks);

    tables[store.snapshotsStoreName] = [
      {
        pk: eventDocSnapshotPk(docId, 'document'),
        sk: 9999,
        type: store.type,
        data: { type: 'inline', snapshot: { stale: true }, views: ['document'] },
      },
    ];

    const page = listEventsPage(mocks, docId, { includeBase: 'true' });

    expect(page.base).toBeNull();
    expect(page.items).toHaveLength(5);
  });

  it('falls back to the whole log when the snapshot state is offloaded and unreadable', () => {
    const { mocks, tables } = buildMocks();
    const docId = seedDocWithEvents(mocks);

    const fullLog = listEventsPage(mocks, docId).items as EventDocEvent[];

    tables[store.snapshotsStoreName] = [
      { pk: eventDocSnapshotPk(docId, 'document'), sk: eventIdOf(fullLog[2]), type: store.type, data: { type: 'storageDrive', views: ['document'] } },
    ];

    const page = listEventsPage(mocks, docId, { includeBase: 'true' });

    expect(page.base).toBeNull();
    expect(page.items).toHaveLength(5);
  });

  it('returns base: null and an empty page for a doc with no events at all', () => {
    const { mocks } = buildMocks();

    const page = listEventsPage(mocks, 'no-such-doc', { includeBase: 'true' });

    expect(page.base).toBeNull();
    expect(page.items).toEqual([]);
  });

  it('leaves the plain shape untouched when includeBase is not set', () => {
    const { mocks, tables } = buildMocks();
    const docId = seedDocWithEvents(mocks);

    tables[store.snapshotsStoreName] = [
      { pk: eventDocSnapshotPk(docId, 'document'), sk: 1, type: store.type, data: { type: 'inline', snapshot: {}, views: ['document'] } },
    ];

    const page = listEventsPage(mocks, docId);

    expect(page.base).toBeUndefined();
    expect(page.items).toHaveLength(5);
  });
});

import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
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
import { createKvsUpdateMock } from '../../testing/kvsUpdateActionMock';
import { appendEvent } from './appendEvent';
import { create } from './create';
import { listEvents } from './listEvents';

// Proves the real create -> appendEvent -> listEvents story logic (the exact path
// admin session docs use) actually round-trips through a key-value store, not just
// that the client sends the right requests. This is the story logic underneath
// `defineAdminSessionEventDoc` — no admin-specific wiring, just the generic eventDoc
// storage path admin sessions depend on.

const store = buildEventDocStore({ storeName: 'test-admin-sessions', type: 'adminSession' });

const globals: Record<string, string> = {
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'test-user-directory',
};

// Minimal generic evaluator for the operators this flow actually issues
// (Equal / GreaterThan, optionally And'd together) — enough to prove the real
// query conditions the eventDoc data layer builds actually select the right rows.
const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (item: Record<string, unknown>, op: KvsQueryOperation): boolean => {
  if (isCondition(op)) {
    const actual = item[op.key];
    switch (op.operation) {
      case KvsQueryOperationType.Equal:
        return actual === op.valueA;
      case KvsQueryOperationType.GreaterThan:
        return typeof actual === typeof op.valueA && (actual as string | number) > (op.valueA as string | number);
      case KvsQueryOperationType.LessThanOrEqual:
        return typeof actual === typeof op.valueA && (actual as string | number) <= (op.valueA as string | number);
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
  let clock = Date.parse('2026-07-11T00:00:00.000Z');

  return {
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

      // The events store is keyed pk/sk; the summary store is keyed by id — match on
      // whichever identity fields the item actually carries.
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
        items = [...items].sort((a, b) => ((a.sk as number) - (b.sk as number)) * (options?.sortAscending === false ? -1 : 1));
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return { items, nextPageKey: undefined };
    },
  };
};

const baseHttpEvent = (body: unknown): HTTPEvent => ({
  path: '/admin/session',
  query: {},
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

describe('eventDoc session round trip (create -> appendEvent -> listEvents)', () => {
  it('persists a created session doc and every appended event, and lists them back in order', () => {
    const mocks = buildMocks();

    const createResponse = runStory(create(baseHttpEvent({ name: 'joe — 2026-07-11T00:00:00.000Z', code: 'guid-1' })), mocks);
    expect(createResponse.status).toBe(200);
    const summary = JSON.parse(createResponse.body!);
    expect(summary.id).toBeTruthy();

    const appendResponse = runStory(
      appendEvent(
        baseHttpEvent({
          type: 'tabChanged',
          payload: { data: { tab: 2 }, metadata: { version: 1, clientMessageId: 'client-msg-1' } },
        }),
        { id: summary.id },
      ),
      mocks,
    );
    expect(appendResponse.status).toBe(200);
    const appendedEvent = JSON.parse(appendResponse.body!);
    expect(appendedEvent.type).toBe('tabChanged');
    expect(appendedEvent.payload.metadata.eventId).toBe(1);

    // A retried append (same clientMessageId) is WRITTEN — the append path does not read
    // the log and so cannot dedup — and mints its own id. Dedup is the fold's job now: see
    // foldEventDocLog's acceptance rules, which drop the second occurrence so the document
    // is identical either way.
    const retryResponse = runStory(
      appendEvent(
        baseHttpEvent({
          type: 'tabChanged',
          payload: { data: { tab: 2 }, metadata: { version: 1, clientMessageId: 'client-msg-1' } },
        }),
        { id: summary.id },
      ),
      mocks,
    );
    expect(JSON.parse(retryResponse.body!).payload.metadata.eventId).toBe(2);

    const listResponse = runStory(listEvents(baseHttpEvent(undefined), { id: summary.id }), mocks);
    expect(listResponse.status).toBe(200);
    const page = JSON.parse(listResponse.body!);

    // Ids are unique and sort in creation order — minted per event, never allocated.
    const ids = page.items.map((event: { payload: { metadata: { eventId: number } } }) => event.payload.metadata.eventId);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(3);
    expect(page.items[0].type).toBe('INIT_STATE');
    expect(page.items[1].type).toBe('tabChanged');
    expect(page.items[1].payload.data).toEqual({ tab: 2 });
  });
});

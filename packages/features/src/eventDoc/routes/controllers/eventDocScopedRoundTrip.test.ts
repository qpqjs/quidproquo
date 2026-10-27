import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  FileActionType,
  GuidActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  runStory,
  throwsError,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { KvsQueryOperationType } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_EVENTS_STORE_NAME_GLOBAL,
  EVENT_DOC_SCOPE_RESOLVER_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
  EVENT_DOC_USER_DIRECTORY_GLOBAL,
} from '../../constants/eventDocGlobalNames';
import { buildEventDocStore } from '../../context/buildEventDocStore';
import { createKvsUpdateMock } from '../../testing/kvsUpdateActionMock';
import { appendEvent } from './appendEvent';
import { create } from './create';
import { createAsset } from './createAsset';
import { list } from './list';

// Proves the scopeResolver option end-to-end through the REAL controllers: when
// the resolver returns a scope, every storage action the request performs
// carries it (KVS options.scope / File payload.scope); when it returns null
// (Personal) or no resolver is configured, no scope reaches storage.

const store = buildEventDocStore({ storeName: 'test-templates', type: 'template', scopeResolver: 'resolveTestScope' });

const buildGlobals = (scopeResolver: string): Record<string, string> => ({
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'test-user-directory',
  [EVENT_DOC_SCOPE_RESOLVER_GLOBAL]: scopeResolver,
});

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

// The mock records every scope that reaches a storage action, and partitions
// tables by scope so isolation is real, not just asserted on passthrough.
const buildMocks = (resolvedScope: string | null) => {
  const tablesByScope: Record<string, Record<string, Record<string, unknown>[]>> = {};
  const seenKvsScopes: (string | undefined)[] = [];
  const seenFileScopes: (string | undefined)[] = [];
  const globals = buildGlobals('resolveTestScope');
  let guidCounter = 0;
  let clock = Date.parse('2026-07-12T00:00:00.000Z');

  const tableFor = (scope: string | undefined, storeName: string) => {
    const scoped = (tablesByScope[scope ?? ''] ??= {});
    return (scoped[storeName] ??= []);
  };

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

    [InlineFunctionActionType.Execute]: (action: { payload: { functionName: string } }) => {
      if (action.payload.functionName !== 'resolveTestScope') {
        throw new Error(`Unexpected inline function: ${action.payload.functionName}`);
      }
      return resolvedScope;
    },

    [FileActionType.GenerateTemporaryUploadSecureUrl]: (action: { payload: { scope?: string } }) => {
      seenFileScopes.push(action.payload.scope);
      return 'https://example.com/upload';
    },

    [KeyValueStoreActionType.Update]: createKvsUpdateMock({
      tableFor,
      keyName: 'type',
      sortKeyName: 'id',
      onScope: (scope) => seenKvsScopes.push(scope),
    }),

    [KeyValueStoreActionType.Upsert]: (action: {
      payload: { keyValueStoreName: string; item: Record<string, unknown>; options?: { ifNotExists?: boolean; scope?: string } };
    }) => {
      const { keyValueStoreName, item, options } = action.payload;
      seenKvsScopes.push(options?.scope);

      const table = tableFor(options?.scope, keyValueStoreName);
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
      payload: {
        keyValueStoreName: string;
        keyCondition: KvsQueryOperation;
        options?: { sortAscending?: boolean; limit?: number; scope?: string };
      };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      seenKvsScopes.push(options?.scope);

      const table = tableFor(options?.scope, keyValueStoreName);
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

  return { mocks, tablesByScope, seenKvsScopes, seenFileScopes };
};

const httpEvent = (body: unknown): HTTPEvent => ({
  path: '/templates',
  query: {},
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

describe('eventDoc scoped round trip (scopeResolver)', () => {
  it('threads the resolved scope into every storage action of the request', () => {
    const { mocks, seenKvsScopes, seenFileScopes } = buildMocks('tenant-a');

    const createResponse = runStory(create(httpEvent({ name: 'Doc A', code: 'doc-a' })), mocks);
    expect(createResponse.status).toBe(200);
    const summary = JSON.parse(createResponse.body!);

    const appendResponse = runStory(
      appendEvent(httpEvent({ type: 'setThing', payload: { data: { x: 1 }, metadata: { version: 1, clientMessageId: 'm1' } } }), {
        id: summary.id,
      }),
      mocks,
    );
    expect(appendResponse.status).toBe(200);

    const assetResponse = runStory(createAsset(httpEvent({ contentType: 'image/png' }), { id: summary.id }), mocks);
    expect(assetResponse.status).toBe(200);

    expect(seenKvsScopes.length).toBeGreaterThan(0);
    expect(seenKvsScopes.every((scope) => scope === 'tenant-a')).toBe(true);
    expect(seenFileScopes).toEqual(['tenant-a']);
  });

  it('lists only the resolved scope: tenant docs invisible to Personal and other tenants', () => {
    const tenantA = buildMocks('tenant-a');
    runStory(create(httpEvent({ name: 'Doc A', code: 'doc-a' })), tenantA.mocks);

    // list returns a page (QpqPagedData), not a bare array.
    const tenantAList = JSON.parse(runStory(list(httpEvent(undefined)), tenantA.mocks).body!);
    expect(tenantAList.items).toHaveLength(1);

    // Same underlying tables, resolver now yields a different scope / Personal.
    const shared = tenantA;
    const asScope = (scope: string | null) => ({
      ...shared.mocks,
      [InlineFunctionActionType.Execute]: () => scope,
    });

    expect(JSON.parse(runStory(list(httpEvent(undefined)), asScope('tenant-b')).body!).items).toHaveLength(0);
    expect(JSON.parse(runStory(list(httpEvent(undefined)), asScope(null)).body!).items).toHaveLength(0);
  });

  it('runs unscoped when the resolver returns null (Personal)', () => {
    const { mocks, seenKvsScopes } = buildMocks(null);

    const createResponse = runStory(create(httpEvent({ name: 'Doc P', code: 'doc-p' })), mocks);
    expect(createResponse.status).toBe(200);

    expect(seenKvsScopes.length).toBeGreaterThan(0);
    expect(seenKvsScopes.every((scope) => scope === undefined)).toBe(true);
  });
});

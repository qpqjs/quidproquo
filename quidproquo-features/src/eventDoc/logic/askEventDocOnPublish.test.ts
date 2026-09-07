import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  GuidActionType,
  InlineFunctionActionType,
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
  EVENT_DOC_ON_PUBLISH_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
  EVENT_DOC_USER_DIRECTORY_GLOBAL,
} from '../constants/eventDocGlobalNames';
import { buildEventDocStore } from '../context/buildEventDocStore';
import { EventDocEffect, EventDocStatus } from '../models';
import { appendEvent } from '../routes/controllers/appendEvent';
import { create } from '../routes/controllers/create';
import { createKvsUpdateMock } from '../testing/kvsUpdateActionMock';

// Exercises the new onPublish hook through the real append path: it must fire
// exactly on Publish-effect appends (after the event and summary are written),
// stay silent for other events and unconfigured collections, and propagate a
// hook failure without re-appending.

const store = buildEventDocStore({ storeName: 'test-tenants', type: 'tenant', onPublish: 'syncTenantRecord' });

const buildGlobals = (onPublish: string): Record<string, string> => ({
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'test-user-directory',
  [EVENT_DOC_ON_PUBLISH_GLOBAL]: onPublish,
});

const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (item: Record<string, unknown>, op: KvsQueryOperation): boolean => {
  if (isCondition(op)) {
    const actual = item[op.key];
    switch (op.operation) {
      case KvsQueryOperationType.Equal:
        return actual === op.valueA;
      case KvsQueryOperationType.GreaterThan:
        // Sort keys are numeric event ids on the event/snapshot stores and strings on
        // the summary index; compare whichever arrives.
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

type InlineInvocation = { functionName: string; payload: any };

const buildMocks = (onPublish: string, onInlineExecute?: () => unknown) => {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const inlineInvocations: InlineInvocation[] = [];
  const globals = buildGlobals(onPublish);
  let guidCounter = 0;
  let clock = Date.parse('2026-07-11T00:00:00.000Z');

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',

    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe', exp: 0, userDirectory: 'test-user-directory', wasValid: true },

    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),
    [GuidActionType.New]: () => `guid-${++guidCounter}`,

    [InlineFunctionActionType.Execute]: (action: { payload: InlineInvocation }) => {
      inlineInvocations.push(action.payload);
      return onInlineExecute ? onInlineExecute() : undefined;
    },

    // No functions object registered for this collection: the hook-state derivation
    // falls back to the reserved base fold (see askEventDocHookStates).
    [DynamicFunctionsActionType.Execute]: throwsError(
      DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound,
      'Dynamic functions not found: [test-tenants#tenant#eventDocFunctions]',
    ),

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
        items = [...items].sort((a, b) => String(a.sk).localeCompare(String(b.sk)) * (options?.sortAscending === false ? -1 : 1));
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return { items, nextPageKey: undefined };
    },
  };

  return { mocks, inlineInvocations, tables };
};

const baseHttpEvent = (body: unknown): HTTPEvent => ({
  path: '/tenants',
  query: {},
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

const createDoc = (mocks: Record<string, unknown>) => {
  const createResponse = runStory(create(baseHttpEvent({ name: 'credit-corp', code: 'guid-0' })), mocks);
  expect(createResponse.status).toBe(200);
  return JSON.parse(createResponse.body!);
};

const publishBody = (clientMessageId: string) => ({
  type: EventDocEffect.Publish,
  payload: { data: { effectiveFrom: '2026-07-11T00:00:00.000Z' }, metadata: { version: 1, clientMessageId } },
});

describe('eventDoc onPublish hook', () => {
  it('invokes the configured inline function with docId, event, and summary on a Publish append', () => {
    const { mocks, inlineInvocations } = buildMocks('syncTenantRecord');
    const summary = createDoc(mocks);

    const response = runStory(appendEvent(baseHttpEvent(publishBody('msg-1')), { id: summary.id }), mocks);
    expect(response.status).toBe(200);

    expect(inlineInvocations).toHaveLength(1);
    expect(inlineInvocations[0].functionName).toBe('syncTenantRecord');
    expect(inlineInvocations[0].payload.docId).toBe(summary.id);
    expect(inlineInvocations[0].payload.event.type).toBe(EventDocEffect.Publish);
    expect(inlineInvocations[0].payload.summary.id).toBe(summary.id);

    // The folded state pair rides along so the hook never re-reads or re-folds the log:
    // published after the event, still a draft before it.
    expect(inlineInvocations[0].payload.state.status).toBe(EventDocStatus.Published);
    expect(inlineInvocations[0].payload.previousState.status).toBe(EventDocStatus.Draft);
  });

  it('does not invoke the hook for non-Publish events', () => {
    const { mocks, inlineInvocations } = buildMocks('syncTenantRecord');
    const summary = createDoc(mocks);

    const response = runStory(
      appendEvent(baseHttpEvent({ type: 'setBrand', payload: { data: { brandColors: {} }, metadata: { version: 1, clientMessageId: 'msg-1' } } }), {
        id: summary.id,
      }),
      mocks,
    );

    expect(response.status).toBe(200);
    expect(inlineInvocations).toHaveLength(0);
  });

  it('is a no-op when the collection configures no onPublish', () => {
    const { mocks, inlineInvocations } = buildMocks('');
    const summary = createDoc(mocks);

    const response = runStory(appendEvent(baseHttpEvent(publishBody('msg-1')), { id: summary.id }), mocks);

    expect(response.status).toBe(200);
    expect(inlineInvocations).toHaveLength(0);
  });

  it('propagates a hook failure without re-appending the event', () => {
    // A failing hook must surface as an error even though the event landed.
    const throwsFromHook = () => throwsError(askKeyValueStoreUpsertBase.errorType.Conflict, 'read model write lost a race');

    const { mocks, inlineInvocations, tables } = buildMocks('syncTenantRecord', throwsFromHook);
    const summary = createDoc(mocks);

    expect(() => runStory(appendEvent(baseHttpEvent(publishBody('msg-1')), { id: summary.id }), mocks)).toThrow(/read model write lost a race/);

    expect(inlineInvocations).toHaveLength(1);

    // The publish event itself was appended exactly once (INIT_STATE + PUBLISH).
    const events = tables[store.eventsStoreName] ?? [];
    expect(events).toHaveLength(2);
  });

  it('re-fires the hook on a publish retry so a stale read model can be repaired', () => {
    const { mocks, inlineInvocations, tables } = buildMocks('syncTenantRecord');
    const summary = createDoc(mocks);

    runStory(appendEvent(baseHttpEvent(publishBody('msg-1')), { id: summary.id }), mocks);
    runStory(appendEvent(baseHttpEvent(publishBody('msg-1')), { id: summary.id }), mocks);

    expect(inlineInvocations).toHaveLength(2);

    // The retry is written rather than deduped (the append reads nothing), so the hook
    // fires again with the state as of the retried event — the duplicate is dropped by
    // the fold's clientMessageId window, so the state is identical. Hooks must be
    // idempotent, and re-firing is exactly how a read model left stale by a failed first
    // hook gets repaired.
    expect(inlineInvocations[1].payload.state.status).toBe(EventDocStatus.Published);
    expect(inlineInvocations[1].payload.summary.id).toBe(summary.id);

    const events = tables[store.eventsStoreName] ?? [];
    expect(events).toHaveLength(3);

    // The duplicate does NOT double the version history: the fold drops it on
    // clientMessageId, so the record still shows one published version.
    const record = (tables[store.storeName] ?? []).find((row) => row.id === summary.id) as { versions: unknown[] };
    expect(record.versions).toHaveLength(1);
  });
});

import {
  askKeyValueStoreUpsertManyBase,
  DateActionType,
  DynamicFunctionsActionType,
  GuidActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  PlatformActionType,
  runStory,
  throwsError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocStoreOptions } from '../context/buildEventDocStore';
import { EventDocEffect, EventDocEvent, EventDocEventActor, EventDocServerEventInput } from '../models';
import { askEventDocAppendServerEvents } from './askEventDocAppendServerEvents';

// The batch append's load-bearing guarantees live in this composition, not in the
// primitives it calls: the run lands as consecutive ids above the consistently-read
// head (input order = log order), ONE shared createdAt, ONE batch guid mint for the
// clientMessageIds, one conditional batch write, the empty-input zero-action
// short-circuit, the re-read-and-re-lap when the batch loses its slots, and the loud
// rejection of hook stores / Publish effects (the two things a batch would silently skip).

const DOC_ID = 'doc-1';
const NOW = '2026-08-03T00:00:00.000Z';
const ACTOR = { userId: 'user-1' } as EventDocEventActor;

const STORE: EventDocStoreOptions = { storeName: 'test-instances', type: 'flowInstance' };

const INPUTS: EventDocServerEventInput[] = [
  { type: 'RUN_STARTED', data: { at: '2026-08-03T00:00:00.100Z' }, version: 3 },
  { type: 'NODE_ENTERED', data: { at: '2026-08-03T00:00:00.200Z' }, version: 3 },
  { type: 'RUN_COMPLETED', data: { at: '2026-08-03T00:00:00.300Z' }, version: 3 },
];

// The log the head reads see: INIT, an edit, then a PUBLISH — so a batch whose base was
// head 0 and which loses its slots to the publish must be re-judged against a published
// document.
const LOG_TYPES: Record<number, string> = { 0: EventDocEffect.InitState, 1: 'SET_X', 2: EventDocEffect.Publish };

const logRow = (eventId: number) => ({
  pk: DOC_ID,
  sk: eventId,
  type: STORE.type,
  data: {
    type: LOG_TYPES[eventId] ?? 'X',
    payload: { data: {}, metadata: { version: 3, clientMessageId: `m-${eventId}`, createdBy: ACTOR, createdAt: NOW, eventId } },
  } as EventDocEvent,
});

// The sort-key bounds a list read asks for, so the mock can serve the gap after a lost lap.
const skBounds = (op: KvsQueryOperation): { after?: number; upTo?: number } => {
  if ('conditions' in op) {
    return Object.assign({}, ...(op as KvsLogicalOperator).conditions.map(skBounds));
  }
  const condition = op as KvsQueryCondition;
  if (condition.key !== 'sk') {
    return {};
  }
  switch (condition.operation) {
    case KvsQueryOperationType.GreaterThan:
      return { after: Number(condition.valueA) };
    case KvsQueryOperationType.LessThanOrEqual:
      return { upTo: Number(condition.valueA) };
    case KvsQueryOperationType.Between:
      return { after: Number(condition.valueA), upTo: Number(condition.valueB) };
    default:
      return {};
  }
};

type UpsertManyPayload = { keyValueStoreName: string; items: any[]; options?: { ifNotExists?: boolean; scope?: string } };

// `heads` is the sequence of head ids the consistent tail read returns, one per read;
// `conflicts` is how many batch writes lose their slots before one lands.
const buildMocks = ({ heads = [0], conflicts = 0 }: { heads?: number[]; conflicts?: number } = {}) => {
  const upserts: UpsertManyPayload[] = [];
  const counts = { dateNow: 0, guidMints: 0, headReads: 0, delays: 0, functionCalls: {} as Record<string, number> };
  let remainingConflicts = conflicts;

  const mocks = {
    [DateActionType.Now]: () => {
      counts.dateNow += 1;
      return NOW;
    },
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) => {
      counts.guidMints += 1;
      return Array.from({ length: action.payload.count }, (_, index) => `cmid-${index}`);
    },
    [GuidActionType.New]: () => 'jitter-guid',
    [PlatformActionType.Delay]: () => {
      counts.delays += 1;
      return undefined;
    },
    // A registered definition whose fold tracks one fact — is the document published —
    // and whose validator refuses anything after a publish. Only reached with validate.
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: unknown[] } }) => {
      const { functionName, args } = action.payload;
      counts.functionCalls[functionName] = (counts.functionCalls[functionName] ?? 0) + 1;

      if (functionName === 'foldDocumentState') {
        const [events, seed] = args as [EventDocEvent[], { published?: boolean } | undefined];
        return { published: !!seed?.published || events.some((event) => event.type === EventDocEffect.Publish) };
      }
      if (functionName === 'validateEvent') {
        const [, state] = args as [EventDocEvent, { published: boolean }];
        return state.published ? 'document is published' : null;
      }
      throw new Error(`unexpected dynamic function ${functionName}`);
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: {
        keyValueStoreName: string;
        keyCondition: KvsQueryOperation;
        options?: { consistentRead?: boolean; sortAscending?: boolean; limit?: number };
      };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;

      if (keyValueStoreName === eventDocSnapshotsStoreName(STORE.storeName)) {
        return { items: [], nextPageKey: undefined };
      }

      expect(options?.consistentRead).toBe(true);

      // The head read: newest first, one row. Every other read is a list over a range.
      if (options?.limit === 1 && options.sortAscending === false) {
        const head = heads[Math.min(counts.headReads, heads.length - 1)];
        counts.headReads += 1;
        return { items: [logRow(head)], nextPageKey: undefined };
      }

      const { after = -1, upTo = 2 } = skBounds(keyCondition);
      const items = [0, 1, 2].filter((eventId) => eventId > after && eventId <= upTo).map(logRow);
      return { items, nextPageKey: undefined };
    },
    [KeyValueStoreActionType.UpsertMany]: (action: { payload: UpsertManyPayload }) => {
      upserts.push(action.payload);
      if (remainingConflicts > 0) {
        remainingConflicts -= 1;
        return throwsError(askKeyValueStoreUpsertManyBase.errorType.Conflict, 'slots taken');
      }
      return undefined;
    },
  };

  return { mocks, upserts, counts };
};

const runAppend = (inputs: EventDocServerEventInput[], store: EventDocStoreOptions, mocks: object, options?: { validate: boolean }) =>
  runStory(askEventDocProvideStore(store, askEventDocAppendServerEvents(DOC_ID, inputs, ACTOR, options)), mocks);

describe('askEventDocAppendServerEvents', () => {
  it('lands the whole burst above the head in one conditional write: consecutive ids, shared createdAt', () => {
    const { mocks, upserts, counts } = buildMocks({ heads: [4] });

    const events = runAppend(INPUTS, STORE, mocks);

    expect(events.map((event) => event.type)).toEqual(['RUN_STARTED', 'NODE_ENTERED', 'RUN_COMPLETED']);
    expect(events.map((event) => event.payload.metadata.eventId)).toEqual([5, 6, 7]);
    expect(events.every((event) => event.payload.metadata.createdAt === NOW)).toBe(true);
    expect(events.map((event) => event.payload.metadata.clientMessageId)).toEqual(['cmid-0', 'cmid-1', 'cmid-2']);

    // One clock read, one guid mint, one consistent head read, one write — the whole point of the batch.
    expect(counts).toEqual({ dateNow: 1, guidMints: 1, headReads: 1, delays: 0, functionCalls: {} });
    expect(upserts).toHaveLength(1);
    expect(upserts[0].keyValueStoreName).toBe(eventDocEventsStoreName(STORE.storeName));
    expect(upserts[0].options?.ifNotExists).toBe(true);
    expect(upserts[0].items.map((item: { pk: string; sk: number }) => [item.pk, item.sk])).toEqual([
      [DOC_ID, 5],
      [DOC_ID, 6],
      [DOC_ID, 7],
    ]);
  });

  it('re-reads the head and re-lays the whole run when the batch loses its slots', () => {
    const { mocks, upserts, counts } = buildMocks({ heads: [0, 2], conflicts: 1 });

    const events = runAppend(INPUTS, STORE, mocks);

    expect(upserts.map((upsert) => upsert.items.map((item: { sk: number }) => item.sk))).toEqual([
      [1, 2, 3],
      [3, 4, 5],
    ]);
    expect(events.map((event) => event.payload.metadata.eventId)).toEqual([3, 4, 5]);
    expect(counts.headReads).toBe(2);
    expect(counts.delays).toBe(1);
  });

  it('with validate, judges the run event by event against the state at head and then writes once', () => {
    const { mocks, upserts, counts } = buildMocks({ heads: [1] });

    const events = runAppend(INPUTS, STORE, mocks, { validate: true });

    expect(events.map((event) => event.payload.metadata.eventId)).toEqual([2, 3, 4]);
    expect(upserts).toHaveLength(1);
    // One fold to resolve the head state, then a validator call and a one-event fold per event.
    expect(counts.functionCalls).toEqual({ foldDocumentState: 1 + INPUTS.length, validateEvent: INPUTS.length });
  });

  it('with validate, a Publish that lands in the gap rejects the re-laid run instead of burying it', () => {
    // Base resolves at head 0 (unpublished), the write loses to the edit + PUBLISH at 1..2,
    // and the re-lap folds that gap onto the held state before validating again.
    const { mocks, upserts } = buildMocks({ heads: [0, 2], conflicts: 1 });

    expect(() => runAppend(INPUTS, STORE, mocks, { validate: true })).toThrow(/document is published/);
    // Only the losing write reached the store; the re-lap never wrote.
    expect(upserts).toHaveLength(1);
  });

  it('without validate, the same race re-lays the run blindly above the publish', () => {
    const { mocks, upserts } = buildMocks({ heads: [0, 2], conflicts: 1 });

    const events = runAppend(INPUTS, STORE, mocks);

    expect(events.map((event) => event.payload.metadata.eventId)).toEqual([3, 4, 5]);
    expect(upserts).toHaveLength(2);
  });

  it('gives up with a domain Conflict once the slot race is lost too many times', () => {
    const { mocks } = buildMocks({ conflicts: 100 });

    expect(() => runAppend(INPUTS, STORE, mocks)).toThrow(/lost the slot race/);
  });

  it('short-circuits an empty batch with zero actions', () => {
    const { mocks, upserts, counts } = buildMocks();

    const events = runAppend([], STORE, mocks);

    expect(events).toEqual([]);
    expect(counts).toEqual({ dateNow: 0, guidMints: 0, headReads: 0, delays: 0, functionCalls: {} });
    expect(upserts).toHaveLength(0);
  });

  it('rejects a store with hooks loudly - a batch would silently skip them', () => {
    const { mocks } = buildMocks();

    expect(() => runAppend(INPUTS, { ...STORE, onAppend: 'syncReadModel' }, mocks)).toThrow(/onAppend\/onPublish hooks/);
    expect(() => runAppend(INPUTS, { ...STORE, onPublish: 'syncTenantRecord' }, mocks)).toThrow(/onAppend\/onPublish hooks/);
  });

  it('rejects a Publish effect in the batch - the publish hook path must stay per-event', () => {
    const { mocks } = buildMocks();

    const withPublish: EventDocServerEventInput[] = [...INPUTS, { type: EventDocEffect.Publish, data: {}, version: 3 }];

    expect(() => runAppend(withPublish, STORE, mocks)).toThrow(/cannot batch a Publish/);
  });
});

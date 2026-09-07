import {
  ActionMockMap,
  ConfigActionType,
  DynamicFunctionsActionType,
  FileActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  KvsStreamEventType,
  KvsStreamRecord,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../../constants/eventDocGlobalNames';
import { eventDocSnapshotsStoreName } from '../../constants/eventDocSnapshotsStoreName';
import { EventDocEffect, EventDocEvent, EventDocSnapshotViews } from '../../models';
import { createKvsUpdateMock } from '../../testing/kvsUpdateActionMock';
import { EventDocStoredSnapshot } from '../../types/EventDocStoredSnapshot';
import { projectEventDocSummary } from './eventDocSummaryProjector';

// The projector is what makes the summary a projection rather than a second source of truth,
// so what matters here is that it rebuilds the RIGHT record: the right document, in the right
// tenant scope, under the right collection type.

const STORE = 'test-templates';
const SCOPE_DELIMITER = '@@QPQSCOPE@@';

const eventId = (n: number): number => n;

const event = (type: string, index: number, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'user-1', userDisplayName: 'User One' },
      createdAt: `2026-07-29T00:00:0${index}.000Z` as EventDocEvent['payload']['metadata']['createdAt'],
      eventId: eventId(index),
    },
  },
});

const LOG: EventDocEvent[] = [
  event(EventDocEffect.InitState, 0, { id: 'doc-1', code: 'tpl-1', name: 'Template One' }),
  event(EventDocEffect.SetName, 1, { name: 'Renamed' }),
];

type Row = Record<string, unknown>;

// Pull one sort-key condition of the given operation out of a query's key condition tree.
const skCondition = (keyCondition: KvsQueryOperation, operation: KvsQueryOperationType): KvsQueryCondition | undefined => {
  if ('conditions' in keyCondition) {
    return (keyCondition as KvsLogicalOperator).conditions.map((nested) => skCondition(nested, operation)).find((match) => match !== undefined);
  }

  const condition = keyCondition as KvsQueryCondition;
  return condition.operation === operation ? condition : undefined;
};

const conditionValue = (keyCondition: KvsQueryOperation, key: string, operation: KvsQueryOperationType): string | undefined => {
  if ('conditions' in keyCondition) {
    return (keyCondition as KvsLogicalOperator).conditions.map((nested) => conditionValue(nested, key, operation)).find((v) => v !== undefined);
  }

  const condition = keyCondition as KvsQueryCondition;
  return condition.key === key && condition.operation === operation ? String(condition.valueA) : undefined;
};

// What the projector hands the registered functions object, reassembled from the Execute
// action's positional args for easy asserting.
type FoldCall = {
  dynamicFunctionsName: string;
  member: string;
  input: { events: EventDocEvent[]; seedViews?: EventDocSnapshotViews };
};

type ExecutePayload = { dynamicFunctionsName: string; functionName: string; args: [EventDocEvent[], EventDocSnapshotViews?] };

const buildMocks = (streamPk: string, type = 'template', options?: { functionsName?: string; log?: EventDocEvent[] }) => {
  const tables: Record<string, Row[]> = {};
  const updates: { key: unknown; scope?: string }[] = [];
  const upserts: { keyValueStoreName: string; item: Row; scope?: string }[] = [];
  const fileWrites: { drive: string; filepath: string; data: string; scope?: string }[] = [];
  const blobs: Record<string, string> = {};
  const foldCalls: FoldCall[] = [];

  // The log as the events table actually holds it: pk composed with the scope, and the
  // collection type denormalised onto every row.
  tables[eventDocEventsStoreName(STORE)] = (options?.log ?? LOG).map((e) => ({
    pk: streamPk,
    sk: e.payload.metadata.eventId,
    type,
    data: e,
  }));

  const mocks: ActionMockMap = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => {
      if (action.payload.globalName === EVENT_DOC_STORE_NAME_GLOBAL) {
        return STORE;
      }
      if (action.payload.globalName === EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL) {
        return options?.functionsName ? { [type]: options.functionsName } : {};
      }
      return '';
    },

    // A faithful mini key-value store: honours the pk equality, the sort-key conditions
    // the data layer issues (equal, at-or-before, between), sort direction and limit —
    // enough that the incremental read paths are exercised for real, not hand-waved.
    [KeyValueStoreActionType.Query]: (action: {
      payload: {
        keyValueStoreName: string;
        keyCondition: KvsQueryOperation;
        options?: { scope?: string; sortAscending?: boolean; limit?: number };
      };
    }) => {
      const { keyValueStoreName, keyCondition, options: queryOptions } = action.payload;
      // The processor composes the scope into the pk, so the mock reproduces that: a query
      // finds rows whose stored pk matches the scope it was issued under.
      const rawPk = conditionValue(keyCondition, 'pk', KvsQueryOperationType.Equal) ?? '';
      const wantPk = queryOptions?.scope ? `${queryOptions.scope}${SCOPE_DELIMITER}${rawPk}` : rawPk;

      const skEqual = conditionValue(keyCondition, 'sk', KvsQueryOperationType.Equal);
      const skAtOrBefore = conditionValue(keyCondition, 'sk', KvsQueryOperationType.LessThanOrEqual);
      const between = skCondition(keyCondition, KvsQueryOperationType.Between);

      const items = (tables[keyValueStoreName] ?? []).filter(
        (row) =>
          row.pk === wantPk &&
          (skEqual === undefined || String(row.sk) === skEqual) &&
          (skAtOrBefore === undefined || String(row.sk) <= skAtOrBefore) &&
          (between === undefined || (String(row.sk) >= String(between.valueA) && String(row.sk) <= String(between.valueB))),
      );

      const ascending = queryOptions?.sortAscending !== false;
      const sorted = [...items].sort((a, b) => String(a.sk).localeCompare(String(b.sk)) * (ascending ? 1 : -1));

      return { items: sorted.slice(0, queryOptions?.limit), nextPageKey: undefined };
    },

    [KeyValueStoreActionType.Update]: (action: {
      payload: { keyValueStoreName: string; key: unknown; sortKey?: unknown; updates: any; options?: { scope?: string } };
    }) => {
      updates.push({ key: action.payload.key, scope: action.payload.options?.scope });
      return createKvsUpdateMock({
        tableFor: (_scope, storeName) => (tables[storeName] ??= []),
        keyName: 'type',
        sortKeyName: 'id',
      })(action as any);
    },

    [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: Row; options?: { scope?: string } } }) => {
      upserts.push({ keyValueStoreName: action.payload.keyValueStoreName, item: action.payload.item, scope: action.payload.options?.scope });
      (tables[action.payload.keyValueStoreName] ??= []).push(action.payload.item);
      return action.payload.item;
    },

    [FileActionType.WriteTextContents]: (action: { payload: { drive: string; filepath: string; data: string; scope?: string } }) => {
      fileWrites.push({
        drive: action.payload.drive,
        filepath: action.payload.filepath,
        data: action.payload.data,
        scope: action.payload.scope,
      });
      blobs[action.payload.filepath] = action.payload.data;
    },

    [FileActionType.ReadTextContents]: (action: { payload: { filepath: string } }) => {
      const blob = blobs[action.payload.filepath];
      if (blob === undefined) {
        throw new Error(`No blob at ${action.payload.filepath}`);
      }
      return blob;
    },

    // Stands in for the app-registered functions object: echoes what it was invoked with
    // (so the spec can assert the prefix) and returns one small state per view.
    [DynamicFunctionsActionType.Execute]: (action: { payload: ExecutePayload }) => {
      const [events, seedViews] = action.payload.args;
      foldCalls.push({
        dynamicFunctionsName: action.payload.dynamicFunctionsName,
        member: action.payload.functionName,
        input: { events, seedViews },
      });
      return {
        document: { foldedEvents: events.length },
        summary: { name: 'from-fold' },
      };
    },
  };

  return { mocks, tables, updates, upserts, fileWrites, blobs, foldCalls };
};

// Shaped as the action processor hands them over: keys already raw, scope alongside.
const streamRecord = (scope: string | undefined, type = 'template'): KvsStreamRecord => ({
  keyValueStoreName: eventDocEventsStoreName(STORE),
  eventType: KvsStreamEventType.Insert,
  scope,
  keys: { pk: 'doc-1', sk: eventId(1) },
  newImage: { pk: 'doc-1', sk: eventId(1), type, data: LOG[1] } as any,
});

describe('projectEventDocSummary', () => {
  it('rebuilds the summary from the log, folding the whole thing', () => {
    const { mocks, tables } = buildMocks('doc-1');

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    expect(record).toBeDefined();
    // SET_NAME is folded, so the projection reflects the log rather than only INIT.
    expect(record!.name).toBe('Renamed');
    expect(record!.code).toBe('tpl-1');
  });

  it('re-enters the scope the record carries', () => {
    // Without this the rebuild would read an empty log and write into the unscoped partition.
    const { mocks, updates, tables } = buildMocks(`tenant-a${SCOPE_DELIMITER}doc-1`);

    runStory(projectEventDocSummary(streamRecord('tenant-a')), mocks);

    expect(updates).toHaveLength(1);
    expect(updates[0].scope).toBe('tenant-a');

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    expect(record!.name).toBe('Renamed');
  });

  it('takes the collection type off the row, not from config', () => {
    // One events table can host several collections, so the type cannot come from a global.
    const { mocks, updates } = buildMocks('doc-1', 'layout');

    runStory(projectEventDocSummary(streamRecord(undefined, 'layout')), mocks);

    expect(updates[0].key).toBe('layout');
  });

  it('skips a record with no collection type rather than guessing one', () => {
    const { mocks, updates } = buildMocks('doc-1');

    const untyped: KvsStreamRecord = { ...streamRecord(undefined), newImage: undefined, oldImage: undefined };
    runStory(projectEventDocSummary(untyped), mocks);

    expect(updates).toHaveLength(0);
  });
});

// The snapshot half of the projector: for a collection that registered a snapshot fold,
// each delivery also stores the folded views as of the batch's newest event. Fragmentation
// comes from the stream's own coalescing — one snapshot per document per batch — so there
// is nothing to test about WHEN beyond "at the record's own event id".
describe('projectEventDocSummary snapshots', () => {
  const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE);
  const FOLD_FN = 'foldTemplateSnapshot';

  it('stores one row per view the fold returns, keyed at the batch newest event', () => {
    const { mocks, tables, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls).toHaveLength(1);
    expect(foldCalls[0].dynamicFunctionsName).toBe(FOLD_FN);
    expect(foldCalls[0].member).toBe('foldSnapshotViews');

    const rows = (tables[SNAPSHOTS_STORE] ?? []) as EventDocStoredSnapshot[];
    expect(rows.map((row) => row.pk).sort()).toEqual(['doc-1#document', 'doc-1#summary']);
    // sk is the SAME numeric event id the log is ordered by — the snapshot addresses the
    // exact event it captures.
    expect(rows.every((row) => row.sk === eventId(1))).toBe(true);
    expect(rows.every((row) => row.type === 'template')).toBe(true);

    const documentRow = rows.find((row) => row.pk === 'doc-1#document')!;
    expect(documentRow.data).toEqual({ type: 'inline', snapshot: { foldedEvents: 2 }, views: ['document', 'summary'] });

    // Only the document row carries the manifest, and it lands LAST — the set's commit
    // marker, so a seed reader anchored on it never sees a partially written set.
    const summaryRow = rows.find((row) => row.pk === 'doc-1#summary')!;
    expect(summaryRow.data).toEqual({ type: 'inline', snapshot: { name: 'from-fold' } });
  });

  it('derives the summary row from the fold, not a whole-log refold', () => {
    const { mocks, tables } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    // The fake fold's sentinel, NOT the log's 'Renamed' — one incremental fold now
    // feeds both the snapshot set and the queryable record.
    expect(record!.name).toBe('from-fold');
  });

  it('sets and removes deletedAt on the summary row as the fold view carries it', () => {
    const { mocks, tables } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    // The record starts soft-deleted; the fold's summary view carries no deletedAt (a
    // RESTORE landed), so the attribute must be REMOVED — the list read hides deleted
    // rows by attribute existence, and a stale flag would hide the doc forever.
    tables[STORE] = [{ type: 'template', id: 'doc-1', name: 'old', deletedAt: '2026-07-01T00:00:00.000Z' }];

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    expect(record!.name).toBe('from-fold');
    expect('deletedAt' in record!).toBe(false);

    // And the inverse: a view carrying deletedAt lands it on the row.
    mocks[DynamicFunctionsActionType.Execute] = () => ({
      document: {},
      summary: { name: 'gone', deletedAt: '2026-07-30T00:00:00.000Z' },
    });
    // A fresh event id so the seed-at-event replay skip doesn't short-circuit the fold.
    tables[eventDocEventsStoreName(STORE)].push({ pk: 'doc-1', sk: eventId(2), type: 'template', data: event(EventDocEffect.Delete, 2, {}) });
    runStory(projectEventDocSummary({ ...streamRecord(undefined), keys: { pk: 'doc-1', sk: eventId(2) } }), mocks);

    const deleted = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    expect(deleted!.deletedAt).toBe('2026-07-30T00:00:00.000Z');
  });

  it('folds the PREFIX up to the stream record, not the whole log', () => {
    // The batch's newest event may not be the log's newest by the time the handler runs —
    // a later append may already be in the table. The snapshot at THIS event must not
    // include it, or the row would claim a state the event id contradicts.
    const logWithLaterAppend = [...LOG, event(EventDocEffect.SetName, 2, { name: 'Renamed again' })];
    const { mocks, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN, log: logWithLaterAppend });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls[0].input.events.map((e) => e.payload.metadata.eventId)).toEqual([eventId(0), eventId(1)]);
  });

  it('writes no snapshot when the collection registered no fold', () => {
    const { mocks, tables, foldCalls, updates } = buildMocks('doc-1');

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    // The summary projection is untouched by snapshots being off.
    expect(updates).toHaveLength(1);
    expect(foldCalls).toHaveLength(0);
    expect(tables[SNAPSHOTS_STORE]).toBeUndefined();
  });

  it('does not snapshot on a Remove, and rebuilds the summary from the WHOLE log', () => {
    // A Remove means rows were deleted out from under the stream (a transfer rewrote the
    // log) — a snapshot-seeded fold could resume from a snapshot of the OLD log, so the
    // summary re-derives from scratch and no snapshot is written.
    const { mocks, tables, updates, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    runStory(projectEventDocSummary({ ...streamRecord(undefined), eventType: KvsStreamEventType.Remove }), mocks);

    expect(updates).toHaveLength(1);
    expect(foldCalls).toHaveLength(0);
    expect(tables[SNAPSHOTS_STORE]).toBeUndefined();

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    // From the log ('Renamed'), not the registered fold's sentinel ('from-fold').
    expect(record!.name).toBe('Renamed');
  });

  it('offloads a state over the inline cap to the blob drive, row recording only that', () => {
    const { mocks, tables, fileWrites } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    // A fold whose document state cannot fit a KVS row.
    mocks[DynamicFunctionsActionType.Execute] = () => ({ document: { huge: 'x'.repeat(301 * 1024) } });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(fileWrites).toHaveLength(1);
    expect(fileWrites[0].filepath).toBe(`doc-1/snapshots/document/${eventId(1)}`);
    expect(JSON.parse(fileWrites[0].data)).toEqual({ huge: 'x'.repeat(301 * 1024) });

    const rows = (tables[SNAPSHOTS_STORE] ?? []) as EventDocStoredSnapshot[];
    expect(rows).toHaveLength(1);
    // No path on the row: it is derived from the row's own keys, so the two cannot drift.
    expect(rows[0].data).toEqual({ type: 'storageDrive', views: ['document'] });
  });

  it('carries the tenant scope through the prefix read and every snapshot write', () => {
    const { mocks, upserts, foldCalls } = buildMocks(`tenant-a${SCOPE_DELIMITER}doc-1`, 'template', { functionsName: FOLD_FN });

    runStory(projectEventDocSummary(streamRecord('tenant-a')), mocks);

    // The scoped prefix read found the log (it lives under the composed pk).
    expect(foldCalls[0].input.events).toHaveLength(2);

    const snapshotUpserts = upserts.filter((upsert) => upsert.keyValueStoreName === SNAPSHOTS_STORE);
    expect(snapshotUpserts).toHaveLength(2);
    expect(snapshotUpserts.every((upsert) => upsert.scope === 'tenant-a')).toBe(true);
  });

  it('writes the document row LAST, so a torn set never has a commit marker', () => {
    const { mocks, upserts } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    const snapshotPks = upserts.filter((upsert) => upsert.keyValueStoreName === SNAPSHOTS_STORE).map((upsert) => upsert.item.pk);
    expect(snapshotPks).toEqual(['doc-1#summary', 'doc-1#document']);
  });
});

// The incremental path: seed from the newest complete snapshot at or before the target
// event and fold only the gap — the reason snapshot cost tracks the burst, not the log.
describe('projectEventDocSummary incremental snapshots', () => {
  const SNAPSHOTS_STORE = eventDocSnapshotsStoreName(STORE);
  const FOLD_FN = 'foldTemplateSnapshot';

  const seedRowsAt = (sk: number): Row[] => [
    { pk: 'doc-1#summary', sk, type: 'template', data: { type: 'inline', snapshot: { seedSummary: true } } },
    { pk: 'doc-1#document', sk, type: 'template', data: { type: 'inline', snapshot: { seedDocument: true }, views: ['document', 'summary'] } },
  ];

  it('hands the fold the seed and ONLY the gap since it', () => {
    const { mocks, tables, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });
    tables[SNAPSHOTS_STORE] = seedRowsAt(eventId(0));

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls).toHaveLength(1);
    expect(foldCalls[0].input.events.map((e) => e.payload.metadata.eventId)).toEqual([eventId(1)]);
    expect(foldCalls[0].input.seedViews).toEqual({ document: { seedDocument: true }, summary: { seedSummary: true } });

    // The new snapshot lands at the target event, alongside the seed rows.
    const rows = tables[SNAPSHOTS_STORE] as EventDocStoredSnapshot[];
    expect(
      rows
        .filter((row) => row.sk === eventId(1))
        .map((row) => row.pk)
        .sort(),
    ).toEqual(['doc-1#document', 'doc-1#summary']);
  });

  it('skips the fold when a complete snapshot already exists at the target event, but still rewrites the summary from it', () => {
    // The document row is the set's last write, so its presence at the target means the
    // snapshot work is done — but an earlier delivery may have died between the summary
    // write and the snapshot writes, so the replay re-covers the summary row from the
    // seed's own summary view rather than trusting it landed.
    const { mocks, tables, foldCalls, upserts } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });
    tables[SNAPSHOTS_STORE] = [
      { pk: 'doc-1#summary', sk: eventId(1), type: 'template', data: { type: 'inline', snapshot: { name: 'from-seed' } } },
      {
        pk: 'doc-1#document',
        sk: eventId(1),
        type: 'template',
        data: { type: 'inline', snapshot: { seedDocument: true }, views: ['document', 'summary'] },
      },
    ];

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls).toHaveLength(0);
    expect(upserts.filter((upsert) => upsert.keyValueStoreName === SNAPSHOTS_STORE)).toHaveLength(0);

    const record = (tables[STORE] ?? []).find((row) => row.id === 'doc-1');
    expect(record!.name).toBe('from-seed');
  });

  it('falls back to a from-scratch fold when the fold declines the seed', () => {
    // A view added since the seed was written: the fold returns null rather than fold the
    // new view from nothing, and the projector retries with the whole prefix.
    const { mocks, tables, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });
    tables[SNAPSHOTS_STORE] = seedRowsAt(eventId(0));

    mocks[DynamicFunctionsActionType.Execute] = (action: { payload: ExecutePayload }) => {
      const [events, seedViews] = action.payload.args;
      foldCalls.push({
        dynamicFunctionsName: action.payload.dynamicFunctionsName,
        member: action.payload.functionName,
        input: { events, seedViews },
      });
      return seedViews ? null : { document: { refolded: true } };
    };

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls).toHaveLength(2);
    expect(foldCalls[0].input.seedViews).toBeDefined();
    expect(foldCalls[1].input.seedViews).toBeUndefined();
    expect(foldCalls[1].input.events.map((e) => e.payload.metadata.eventId)).toEqual([eventId(0), eventId(1)]);

    const documentRow = (tables[SNAPSHOTS_STORE] as EventDocStoredSnapshot[]).find((row) => row.sk === eventId(1))!;
    expect(documentRow.data).toEqual({ type: 'inline', snapshot: { refolded: true }, views: ['document'] });
  });

  it('ignores a pre-manifest snapshot and folds the whole prefix', () => {
    // Rows written before manifests existed cannot prove the set is complete, so they are
    // not seeds; the next full fold rewrites them with one.
    const { mocks, tables, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });
    tables[SNAPSHOTS_STORE] = [
      { pk: 'doc-1#document', sk: eventId(0), type: 'template', data: { type: 'inline', snapshot: { seedDocument: true } } },
    ];

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls).toHaveLength(1);
    expect(foldCalls[0].input.seedViews).toBeUndefined();
    expect(foldCalls[0].input.events.map((e) => e.payload.metadata.eventId)).toEqual([eventId(0), eventId(1)]);
  });

  it('resolves an offloaded seed state from the blob drive', () => {
    const { mocks, tables, blobs, foldCalls } = buildMocks('doc-1', 'template', { functionsName: FOLD_FN });
    tables[SNAPSHOTS_STORE] = [
      { pk: 'doc-1#summary', sk: eventId(0), type: 'template', data: { type: 'inline', snapshot: { seedSummary: true } } },
      { pk: 'doc-1#document', sk: eventId(0), type: 'template', data: { type: 'storageDrive', views: ['document', 'summary'] } },
    ];
    blobs[`doc-1/snapshots/document/${eventId(0)}`] = JSON.stringify({ offloadedDocument: true });

    runStory(projectEventDocSummary(streamRecord(undefined)), mocks);

    expect(foldCalls[0].input.seedViews).toEqual({ document: { offloadedDocument: true }, summary: { seedSummary: true } });
    expect(foldCalls[0].input.events.map((e) => e.payload.metadata.eventId)).toEqual([eventId(1)]);
  });
});

import { defineKeyValueStore, defineStorageDrive, kvsKey, QPQConfig } from 'quidproquo-core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../constants/eventDocGlobalNames';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocSummary } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';

export type EventDocSummaryOptions = {
  // Registered dynamic-functions names (see `defineDynamicFunctions`) of each collection's
  // EventDocFunctions object, keyed by doc TYPE — keyed because one events table can host
  // several collections and its ONE stream serves them all. When a row's type has an
  // entry, the stream projector invokes that object's `foldSnapshotViews` with the doc's
  // log prefix and writes the folded views to the snapshots store; a type with no entry is
  // simply not snapshotted. defineEventDoc threads the single-type case through
  // automatically; multi-type stores that call defineEventDocSummary directly pass the
  // whole map here.
  snapshotFunctions?: Record<string, string>;
};

// Model store + append-only event store + snapshot store + blob bucket for a collection.
// Event store has no GSI deliberately: the local dev-server query processor can't target
// one, so all event reads go through the main table. The blob bucket holds the
// collection's immutable assets (and later its derived runtime artifacts) under per-doc
// prefixes.
export const defineEventDocSummary = (keyValueStoreName: string, options?: EventDocSummaryOptions): QPQConfig => [
  defineKeyValueStore<EventDocSummary>(keyValueStoreName, 'type', ['id'], {
    indexes: [{ partitionKey: 'type', sortKey: 'updatedAt' }],
    disablePointInTimeRecovery: false,
  }),
  // The live log: pk=modelId, sk=the event's numeric log position (contiguous from 0).
  //
  // Its change stream drives the summary projector. That is what makes the summary a pure
  // projection: the append writes the event and stops, and the record is rebuilt from the
  // log out of band. Coalescing collapses a batch to one rebuild per document, so a burst of
  // appends to one document costs one re-derivation rather than one per event.
  defineKeyValueStore<EventDocStoredEvent>(eventDocEventsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
    onStream: {
      runtime: {
        ...getFeatureEntryQpqFunctionRuntime('eventDoc', 'kvsStream', 'eventDocSummaryProjector::projectEventDocSummary'),
        // The projector resolves the rest of the store (events table, blob bucket) from this
        // by the same naming convention, and reads the collection `type` off each row, since
        // one events table can host several collections.
        globals: {
          [EVENT_DOC_STORE_NAME_GLOBAL]: keyValueStoreName,
          [EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL]: options?.snapshotFunctions ?? {},
        },
      },
      coalesceByPartitionKey: true,
    },
  }),

  // The snapshot stream: per-view folded states at points along the log, written by the
  // same stream that projects the summary. pk=docId#view / sk=the SAME numeric event id
  // the log is ordered by, so a snapshot addresses the exact event it captures. Defined
  // for every collection (rows only appear for types that register a snapshot fold) so a
  // collection turning snapshots on later is a config change, not a migration.
  defineKeyValueStore<EventDocStoredSnapshot>(eventDocSnapshotsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
  }),
  defineStorageDrive(eventDocStorageDriveName(keyValueStoreName)),
];

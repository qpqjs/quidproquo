import { defineKeyValueStore, defineStorageDrive, kvsKey, QPQConfig } from 'quidproquo-core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../constants/eventDocGlobalNames';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocSummary } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';

/** Options for defineEventDocSummary. */
export type EventDocSummaryOptions = {
  // Registered dynamic-functions name per doc type; a type with no entry is not snapshotted.
  snapshotFunctions?: Record<string, string>;
};

/**
 * Summary store, events store (`${name}Events`), snapshots store (`${name}Snap`) and blob drive for a collection.
 * The events store has no GSI on purpose: the dev-server query processor cannot target one.
 */
export const defineEventDocSummary = (keyValueStoreName: string, options?: EventDocSummaryOptions): QPQConfig => [
  defineKeyValueStore<EventDocSummary>(keyValueStoreName, 'type', ['id'], {
    indexes: [{ partitionKey: 'type', sortKey: 'updatedAt' }],
    disablePointInTimeRecovery: false,
  }),
  // pk=modelId, sk=numeric event id. The stream drives the summary projector; coalescing makes one burst one rebuild.
  defineKeyValueStore<EventDocStoredEvent>(eventDocEventsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
    onStream: {
      runtime: {
        ...getFeatureEntryQpqFunctionRuntime('eventDoc', 'kvsStream', 'eventDocSummaryProjector::projectEventDocSummary'),
        // The projector derives the other store names from this one and reads the doc type off each row.
        globals: {
          [EVENT_DOC_STORE_NAME_GLOBAL]: keyValueStoreName,
          [EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL]: options?.snapshotFunctions ?? {},
        },
      },
      coalesceByPartitionKey: true,
    },
  }),

  // pk=docId#view, sk=the event id the snapshot captures. Defined for every collection so enabling snapshots later
  // is a config change, not a migration.
  defineKeyValueStore<EventDocStoredSnapshot>(eventDocSnapshotsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
  }),
  defineStorageDrive(eventDocStorageDriveName(keyValueStoreName)),
];

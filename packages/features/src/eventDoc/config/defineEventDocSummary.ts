import { CrossModuleOwnerWithNoResourceOverride, defineKeyValueStore, defineStorageDrive, kvsKey, QPQConfig } from '@qpqjs/core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../constants/eventDocGlobalNames';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocSummary } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';

/** Options for defineEventDocSummary. */
export type EventDocSummaryOptions = {
  // Registered dynamic-functions name per doc type; a type with no entry is not snapshotted.
  snapshotFunctions?: Record<string, string>;
  // Every store and the drive refuse unscoped calls. Must match the routes' scopeResolver:
  // defineEventDoc derives it; a direct caller with a resolver sets it.
  scoped?: boolean;
  // The service whose deploy creates the stores and the drive; every other service gets references. Absent: this one.
  owner?: CrossModuleOwnerWithNoResourceOverride;
};

/**
 * The stores and blob drive for a collection: lists (`${name}Lists`, every list view's row per document), events
 * (`${name}Events`) and snapshots (`${name}Snap`). The store under the bare name is the legacy summary store: it stays
 * declared so a rebuild can read its rows, and nothing writes to it.
 */
export const defineEventDocSummary = (keyValueStoreName: string, options?: EventDocSummaryOptions): QPQConfig => [
  defineKeyValueStore<EventDocSummary>(keyValueStoreName, 'type', ['id'], {
    indexes: [{ partitionKey: 'type', sortKey: 'updatedAt' }],
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
  }),
  // pk=modelId, sk=numeric event id. The stream drives the summary projector; coalescing makes one burst one rebuild.
  defineKeyValueStore<EventDocStoredEvent>(eventDocEventsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
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
  // The index shares the table's partition key, so a list query names it to read newest first.
  defineKeyValueStore<EventDocStoredListView>(eventDocListsStoreName(keyValueStoreName), 'pk', ['id'], {
    indexes: [{ partitionKey: 'pk', sortKey: 'updatedAt' }],
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
  }),

  defineKeyValueStore<EventDocStoredSnapshot>(eventDocSnapshotsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
  }),
  defineStorageDrive(eventDocStorageDriveName(keyValueStoreName), { scoped: options?.scoped, owner: options?.owner }),
];

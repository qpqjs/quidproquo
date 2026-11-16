import {
  CrossModuleOwnerWithNoResourceOverride,
  defineKeyValueStore,
  defineQueue,
  defineServiceSettings,
  defineStorageDrive,
  kvsKey,
  QPQConfig,
  QueueQPQConfigSetting,
} from '@qpqjs/core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../constants/eventDocGlobalNames';
import { EVENT_DOC_LISTS_NEWEST_FIRST_INDEX } from '../constants/eventDocListsNewestFirstIndex';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { EVENT_DOC_REPROJECT_QUEUE_MAX_TRIES } from '../constants/eventDocReprojectQueueMaxTries';
import { eventDocReprojectQueueName } from '../constants/eventDocReprojectQueueName';
import { EVENT_DOC_REPROJECT_QUEUE_RETRY_SECONDS } from '../constants/eventDocReprojectQueueRetrySeconds';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocReprojectMessageType, EventDocSummary } from '../models';
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

// The queue a reproject of the collection runs on: a walk that finds its documents a page at a time, and one message
// per document to re-run the projector at its head. Its handlers are handed the same two globals as the stream projector.
const defineReprojectQueue = (keyValueStoreName: string, options?: EventDocSummaryOptions): QueueQPQConfigSetting => {
  const globals = {
    [EVENT_DOC_STORE_NAME_GLOBAL]: keyValueStoreName,
    [EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL]: options?.snapshotFunctions ?? {},
  };

  return defineQueue(
    eventDocReprojectQueueName(keyValueStoreName),
    {
      [EventDocReprojectMessageType.Walk]: {
        ...getFeatureEntryQpqFunctionRuntime('eventDoc', 'queueEvent', 'onEventDocReprojectWalk::onEventDocReprojectWalk'),
        globals,
      },
      [EventDocReprojectMessageType.Document]: {
        ...getFeatureEntryQpqFunctionRuntime('eventDoc', 'queueEvent', 'onEventDocReprojectDocument::onEventDocReprojectDocument'),
        globals,
      },
    },
    { maxTries: EVENT_DOC_REPROJECT_QUEUE_MAX_TRIES, ttRetryInSeconds: EVENT_DOC_REPROJECT_QUEUE_RETRY_SECONDS },
  );
};

/**
 * The stores and blob drive for a collection: lists (`${name}Lists`, every list view's row per document), events
 * (`${name}Events`) and snapshots (`${name}Snap`), plus the queue a reproject of it runs on (`${name}Reproj`). The
 * store under the bare name is the legacy summary store: it stays declared so a rebuild can read its rows, and nothing
 * writes to it.
 */
export const defineEventDocSummary = (keyValueStoreName: string, options?: EventDocSummaryOptions): QPQConfig => [
  // TODO: @joe-coady: drop this legacy summary store once every collection is rebuilt into the lists store, and the
  // reproject walk's LegacySummary source with it.
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

  // pk=viewName#type, sk=document id. The index shares the table's partition key, so a list query names it to read
  // newest first.
  defineKeyValueStore<EventDocStoredListView>(eventDocListsStoreName(keyValueStoreName), 'pk', ['id'], {
    indexes: [{ name: EVENT_DOC_LISTS_NEWEST_FIRST_INDEX, partitionKey: 'pk', sortKey: 'updatedAt' }],
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
  }),

  // pk=docId#view, sk=the event id the snapshot captures. Defined for every collection so enabling snapshots later
  // is a config change, not a migration.
  defineKeyValueStore<EventDocStoredSnapshot>(eventDocSnapshotsStoreName(keyValueStoreName), 'pk', [kvsKey('sk', 'number')], {
    disablePointInTimeRecovery: false,
    scoped: options?.scoped,
    owner: options?.owner,
  }),
  defineStorageDrive(eventDocStorageDriveName(keyValueStoreName), { scoped: options?.scoped, owner: options?.owner }),

  // Owner only, like the stream projector: one service rebuilds a collection's rows and snapshots.
  options?.owner?.module
    ? defineServiceSettings({ [options.owner.module]: [defineReprojectQueue(keyValueStoreName, options)] })
    : defineReprojectQueue(keyValueStoreName, options),
];

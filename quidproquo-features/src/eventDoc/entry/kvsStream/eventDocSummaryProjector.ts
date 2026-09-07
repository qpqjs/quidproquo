import {
  askConfigGetGlobal,
  AskResponse,
  askStorageScopeProvide,
  KvsStreamEventResponse,
  KvsStreamEventType,
  KvsStreamRecord,
} from 'quidproquo-core';

import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../../constants/eventDocGlobalNames';
import { askEventDocStoreProvide } from '../../context/askEventDocStoreProvide';
import { buildEventDocStore } from '../../context/buildEventDocStore';
import { askEventDocProjectAtEvent } from '../../logic/askEventDocProjectAtEvent';
import { askEventDocSummaryRederive } from '../../logic/askEventDocSummaryRederive';
import { EventDocStoredEvent } from '../../types/EventDocStoredEvent';

// The per-document work one stream delivery triggers: ONE incremental fold that writes
// both the queryable summary record and the per-view snapshot set as of the batch's
// newest event — so per-delivery cost tracks the burst, not the log. Pure derivations
// of the log, which is what makes the stream's at-least-once delivery and its retries
// harmless — re-running rewrites the same facts.
//
// The whole-log rederive remains for the cases the incremental fold can't serve: a
// collection with no registered functions object (nothing to fold views with), and a
// Remove record — rows were deleted out from under the stream (a transfer rewrote the
// log), so a snapshot-seeded fold could resume from a snapshot of the OLD log; there is
// also no new event to snapshot at.
//
// Snapshots fragment along the stream's own batching: coalescing hands this handler the
// LAST event per document per batch, so a lone append projects at that event while a
// burst of a hundred projects once, at the burst's newest.
function* askEventDocProjectStreamRecord(record: KvsStreamRecord, modelId: string, functionsName?: string): AskResponse<void> {
  if (!functionsName || record.eventType === KvsStreamEventType.Remove) {
    yield* askEventDocSummaryRederive(modelId);
    return;
  }

  yield* askEventDocProjectAtEvent(modelId, Number(record.keys.sk), functionsName);
}

/**
 * Rebuild a document's summary from its log — and store its snapshot — driven by the
 * event store's change stream.
 *
 * This is what lets the summary be a pure projection. The writer appends an event and stops;
 * nothing on the write path maintains a read model, so the record can be dropped and rebuilt
 * at any time, and a document can have as many views as you care to project.
 *
 * Invoked once per changed document per batch (the store declares
 * `coalesceByPartitionKey`), so a burst of appends to one document costs ONE rebuild rather
 * than one per event. Re-deriving from the log is idempotent, which is what makes a stream's
 * at-least-once delivery and its retries harmless.
 */
export function* projectEventDocSummary(record: KvsStreamRecord): AskResponse<KvsStreamEventResponse> {
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);
  const snapshotFunctions = yield* askConfigGetGlobal<Record<string, string>>(EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL);

  // Keys arrive raw and the scope arrives beside them, so the rebuild simply re-enters the
  // scope the append ran under. That matters more than it looks: reading or writing under the
  // wrong scope would project one tenant's document into another's partition.
  const scope = record.scope;
  const modelId = String(record.keys.pk);

  // Which collection this document belongs to. It comes off the row rather than from config
  // because one events table can host several collections, and the stream serves the table.
  // A REMOVE carries no new image, so fall back to what was there.
  const image = (record.newImage ?? record.oldImage) as EventDocStoredEvent | undefined;

  if (!image?.type) {
    // Nothing identifies the collection, so there is no summary to rebuild. Rather than
    // guess, skip: the alternative is writing a record under the wrong type.
    return;
  }

  const store = buildEventDocStore({ storeName, type: image.type });

  // eslint-disable-next-line qpq/require-yield-star
  const project = askEventDocStoreProvide(store, askEventDocProjectStreamRecord(record, modelId, snapshotFunctions[image.type]));

  // Unscoped rows carry no scope to re-enter, and the ambient default is already "none", so
  // only a scoped row wraps the rebuild in a provider.
  if (scope === undefined) {
    yield* project;

    return;
  }

  yield* askStorageScopeProvide(scope, project);
}

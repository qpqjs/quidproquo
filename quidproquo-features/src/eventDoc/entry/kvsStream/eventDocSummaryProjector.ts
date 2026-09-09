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

// A Remove record means rows were deleted under the stream (a transfer rewrote the log), so a snapshot-seeded fold could
// resume from a snapshot of the old log; rederive from the whole log instead. Same when there is no functions object to fold with.
function* askEventDocProjectStreamRecord(record: KvsStreamRecord, modelId: string, functionsName?: string): AskResponse<void> {
  if (!functionsName || record.eventType === KvsStreamEventType.Remove) {
    yield* askEventDocSummaryRederive(modelId);
    return;
  }

  yield* askEventDocProjectAtEvent(modelId, Number(record.keys.sk), functionsName);
}

/**
 * Events-store stream handler: rebuilds a document's summary and snapshots from its log.
 * The store coalesces by partition key, so one burst of appends is one rebuild; rebuilding is idempotent so retries are harmless.
 */
export function* projectEventDocSummary(record: KvsStreamRecord): AskResponse<KvsStreamEventResponse> {
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);
  const snapshotFunctions = yield* askConfigGetGlobal<Record<string, string>>(EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL);

  const scope = record.scope;
  const modelId = String(record.keys.pk);

  // The doc type comes off the row because one events table can host several collections. A Remove has no new image.
  const image = (record.newImage ?? record.oldImage) as EventDocStoredEvent | undefined;

  if (!image?.type) {
    return;
  }

  const store = buildEventDocStore({ storeName, type: image.type });

  // eslint-disable-next-line qpq/require-yield-star
  const project = askEventDocStoreProvide(store, askEventDocProjectStreamRecord(record, modelId, snapshotFunctions[image.type]));

  // Re-enter the scope the append ran under; projecting under the wrong scope would write one tenant's doc into another's partition.
  if (scope === undefined) {
    yield* project;

    return;
  }

  yield* askStorageScopeProvide(scope, project);
}

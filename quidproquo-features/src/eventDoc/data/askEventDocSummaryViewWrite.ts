import { askKeyValueStoreUpdate, AskResponse, KvsAdvancedDataType, kvsRemove, kvsSet } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummary, EventDocSummaryView } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Persists a folded summary view as field updates on the summary row (`type` and `id` are the keys, never attributes). */
export function* askEventDocSummaryViewWrite(modelId: string, view: EventDocSummaryView): AskResponse<void> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpdate<EventDocSummary>(
    storeName,
    [
      kvsSet('code', view.code),
      kvsSet('name', view.name),
      kvsSet('createdAt', view.createdAt),
      kvsSet('createdBy', view.createdBy),
      kvsSet('updatedAt', view.updatedAt),
      kvsSet('updatedBy', view.updatedBy),
      // Must remove, not skip: the list read hides deleted rows by attribute existence, so a stale deletedAt hides a restored doc.
      view.deletedAt !== undefined ? kvsSet('deletedAt', view.deletedAt) : kvsRemove('deletedAt'),
      // Cast: the marshaller handles a list of maps, but a zod-inferred object type has no index signature to match KvsObjectDataType.
      kvsSet('versions', view.versions as unknown as KvsAdvancedDataType),
    ],
    type,
    modelId,
    { scope },
  );
}

import {
  askCatch,
  askKeyValueStoreUpdate,
  askKeyValueStoreUpdateBase,
  AskResponse,
  askThrowError,
  KvsAdvancedDataType,
  kvsLessThan,
  kvsNotExists,
  kvsOr,
  kvsRemove,
  kvsSet,
} from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummary, EventDocSummaryView } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/**
 * Persists a folded summary view as field updates on the summary row (`type` and `id` are the keys, never attributes).
 * The write lands only when the stored row has no `eventId` or an older one than the view's, so a projection arriving
 * after a newer one can never move the row backwards; false means it was refused.
 */
export function* askEventDocSummaryViewWrite(modelId: string, view: EventDocSummaryView): AskResponse<boolean> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const written = yield* askCatch(
    askKeyValueStoreUpdate<EventDocSummary>(
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
        kvsSet('eventId', view.eventId),
      ],
      type,
      modelId,
      { scope, condition: kvsOr([kvsNotExists('eventId'), kvsLessThan('eventId', view.eventId)]) },
    ),
  );

  if (written.success) {
    return true;
  }

  if (written.error.errorType === askKeyValueStoreUpdateBase.errorType.ConditionFailed) {
    return false;
  }

  return yield* askThrowError(written.error.errorType, written.error.errorText, written.error.errorStack);
}

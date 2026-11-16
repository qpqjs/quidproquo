import {
  askCatch,
  askKeyValueStoreUpdate,
  askKeyValueStoreUpdateBase,
  AskResponse,
  askThrowError,
  KvsAdvancedDataType,
  kvsLessThan,
  kvsLessThanOrEqual,
  kvsNotExists,
  kvsOr,
  kvsRemove,
  kvsSet,
} from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocListViewState } from '../models';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** Options for askEventDocListViewWrite. */
export type EventDocListViewWriteOptions = {
  // The projector's write: it folded this state under the acceptance rules, so it may replace a row already at the
  // same event (one the append path wrote without them). Any other writer only lands over an older row.
  authoritative?: boolean;
};

/**
 * Persists one list view's state as its row, folded through `eventId`. The write lands only over a missing row or an
 * older one (or an equal one when `authoritative`), so a write arriving late never moves a row backwards; false means
 * it was refused.
 */
export function* askEventDocListViewWrite(
  id: string,
  viewName: string,
  eventId: number,
  state: EventDocListViewState,
  options?: EventDocListViewWriteOptions,
): AskResponse<boolean> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  const written = yield* askCatch(
    askKeyValueStoreUpdate<EventDocStoredListView>(
      listsStoreName,
      [
        kvsSet('updatedAt', state.updatedAt),
        // Must remove, not skip: the list read hides deleted rows by attribute existence, so a stale deletedAt hides a restored doc.
        state.deletedAt !== undefined ? kvsSet('deletedAt', state.deletedAt) : kvsRemove('deletedAt'),
        kvsSet('eventId', eventId),
        // Cast: the marshaller handles nested maps and lists, but a view's state type has no index signature to match KvsObjectDataType.
        kvsSet('state', state as unknown as KvsAdvancedDataType),
      ],
      eventDocListViewPk(viewName, type),
      id,
      {
        scope,
        condition: kvsOr([
          kvsNotExists('eventId'),
          options?.authoritative ? kvsLessThanOrEqual('eventId', eventId) : kvsLessThan('eventId', eventId),
        ]),
      },
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

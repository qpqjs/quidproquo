import { askFileWriteObjectJson, AskResponse } from 'quidproquo-core';

import { askEventDocEventDelete, askEventDocResolveScope } from '../../eventDoc/data';
import { EventDocEvent } from '../../eventDoc/models';
import { EVENT_DOC_TRANSFER_DRIVE_NAME, eventDocTransferDiscardedPath } from '../constants';

/**
 * Cut the target's log back to `fromIndex` so a bundle can be applied over the top, and park what was
 * cut on the transfer drive FIRST.
 *
 * The backup is the whole point of the ordering: deleting events is the one irreversible thing this
 * feature does, so the discarded tail is written to `discarded/<transferId>/<docId>.json` before a
 * single delete runs. If the write fails, nothing is deleted.
 *
 * Assets are left alone deliberately. They are immutable and guid-keyed, the surviving prefix may
 * still reference them, and an incoming bundle writes its own at their own guids.
 */
export function* askEventDocTransferTruncateLog(
  transferId: string,
  docId: string,
  existingEvents: EventDocEvent[],
  fromIndex: number,
): AskResponse<EventDocEvent[]> {
  // `fromIndex` is a POSITION in the log (what findEventDocLogDivergence reports and what
  // askEventDocWriteForeignEvents slices on). Ids are contiguous from 0 so the two coincide
  // for a well-formed log, but the slice is by position on purpose: the comparison that
  // produced `fromIndex` was positional, and a malformed log must not turn into a wrong delete.
  const discarded = existingEvents.slice(fromIndex);

  if (discarded.length === 0) {
    return [];
  }

  const scope = yield* askEventDocResolveScope();

  yield* askFileWriteObjectJson(
    EVENT_DOC_TRANSFER_DRIVE_NAME,
    eventDocTransferDiscardedPath(transferId, docId),
    { docId, discardedFromIndex: fromIndex, events: discarded },
    undefined,
    scope,
  );

  for (const event of discarded) {
    yield* askEventDocEventDelete(docId, event.payload.metadata.eventId);
  }

  return discarded;
}

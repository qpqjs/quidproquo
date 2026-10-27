import { askFileWriteObjectJson, AskResponse } from 'quidproquo-core';

import { askEventDocEventDelete, askEventDocResolveScope } from '../../eventDoc/data';
import { EventDocEvent } from '../../eventDoc/models';
import { EVENT_DOC_TRANSFER_DRIVE_NAME, eventDocTransferDiscardedPath } from '../constants';

/**
 * Cuts the target's log back to `fromIndex` and returns what was cut. The discarded tail is written to the transfer drive
 * before any delete runs, so a failed backup deletes nothing. Assets are left alone: the surviving prefix may still reference them.
 */
export function* askEventDocTransferTruncateLog(
  transferId: string,
  docId: string,
  existingEvents: EventDocEvent[],
  fromIndex: number,
): AskResponse<EventDocEvent[]> {
  // Sliced by position, not by event id: the comparison that produced `fromIndex` was positional.
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

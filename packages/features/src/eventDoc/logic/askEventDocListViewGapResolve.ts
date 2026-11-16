import { AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { EventDocEvent } from '../models';

/** The events a list view row still has to fold, and whether they are exactly the ones just appended. */
export type EventDocListViewGap = {
  events: EventDocEvent[];
  // True when the row was right behind the append, so nothing was read from the log and `events` is `appended` itself.
  contiguous: boolean;
};

/**
 * The events that take a list view row from `rowEventId` (null for no row) through the last of `appended`. A row right
 * behind the append needs only the events in hand, the normal case; any other row reads its gap from the log,
 * consistently, since the append landed moments ago.
 */
export function* askEventDocListViewGapResolve(
  modelId: string,
  rowEventId: Nullable<number>,
  appended: EventDocEvent[],
): AskResponse<EventDocListViewGap> {
  const first = appended[0];
  const last = appended[appended.length - 1];

  if (!first || !last) {
    return { events: [], contiguous: true };
  }

  // INIT_STATE is event 0, so a document with no row yet is right behind an append that starts there.
  const nextEventId = rowEventId === null ? 0 : rowEventId + 1;

  if (first.payload.metadata.eventId === nextEventId) {
    return { events: appended, contiguous: true };
  }

  const events = yield* askEventDocEventListAll(modelId, {
    afterEventId: rowEventId ?? undefined,
    upToEventId: last.payload.metadata.eventId,
    consistentRead: true,
  });

  return { events, contiguous: false };
}

import { AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocListViewGet } from '../data/askEventDocListViewGet';
import { askEventDocListViewWrite } from '../data/askEventDocListViewWrite';
import { EventDocEvent, EventDocListViewState } from '../models';
import { askEventDocListViewFold } from './askEventDocListViewFold';
import { askEventDocListViewGapResolve } from './askEventDocListViewGapResolve';

/**
 * Carry one list view's stored row through the events the caller has just appended and write it back. Returns the
 * view's state through the last of them: as written, or as stored when the row was already there. Null when the fold
 * could not decide acceptance from the row alone, which leaves the row to the stream projector. Events read from the
 * log to fill a gap were not vetted by this append, so only a row right behind it is folded as trusted.
 */
export function* askEventDocListViewAdvance(
  modelId: string,
  viewName: string,
  appended: EventDocEvent[],
  trusted: boolean,
): AskResponse<Nullable<EventDocListViewState>> {
  const last = appended[appended.length - 1];

  if (!last) {
    return null;
  }

  const eventId = last.payload.metadata.eventId;
  const row = yield* askEventDocListViewGet(viewName, modelId, { consistentRead: true });

  if (row && row.eventId >= eventId) {
    // This same fold wrote the stored state, so the cast restates provenance.
    return row.state as EventDocListViewState;
  }

  const gap = yield* askEventDocListViewGapResolve(modelId, row?.eventId ?? null, appended);
  const state = yield* askEventDocListViewFold(viewName, gap.events, row?.state ?? null, trusted && gap.contiguous);

  if (state) {
    yield* askEventDocListViewWrite(modelId, viewName, eventId, state);
  }

  return state;
}

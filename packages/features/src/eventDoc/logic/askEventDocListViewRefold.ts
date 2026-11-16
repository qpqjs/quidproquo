import { askCatch, askLogCreate, AskResponse, LogLevelEnum, Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocListViewState } from '../models';
import { askEventDocListViewAdvance } from './askEventDocListViewAdvance';

/**
 * Bring one list view's row up to the events the caller has just appended, in process, so a read that follows the
 * append sees them rather than the row the stream projector has yet to rebuild. `trusted` says the events passed the
 * append gate. Never throws: the events are already durable, so a failure is logged and left to the projector, and a
 * client retry of a failed append would only double-append. Returns the view's state, or null when there is none to give.
 */
export function* askEventDocListViewRefold(
  modelId: string,
  viewName: string,
  appended: EventDocEvent[],
  trusted: boolean,
): AskResponse<Nullable<EventDocListViewState>> {
  const refolded = yield* askCatch(askEventDocListViewAdvance(modelId, viewName, appended, trusted));

  if (!refolded.success) {
    yield* askLogCreate(
      LogLevelEnum.Warn,
      `Could not refold list view ${viewName} of ${modelId} after an append; the stream projector will.`,
      refolded.error,
    );

    return null;
  }

  return refolded.result;
}

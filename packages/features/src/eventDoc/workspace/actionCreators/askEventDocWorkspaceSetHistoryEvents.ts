import { AskResponse, askStateDispatchEffect, Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetHistoryEventsEffect } from '../effects/EventDocWorkspaceSetHistoryEventsEffect';

/** Replaces a slot's saved log and base together; a null base means the events are the whole log. */
export function* askEventDocWorkspaceSetHistoryEvents(
  slotKey: string,
  events: EventDocEvent[],
  base: Nullable<EventDocSnapshotBase> = null,
): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetHistoryEventsEffect>(EventDocWorkspaceEffect.SetHistoryEvents, { slotKey, events, base });
}

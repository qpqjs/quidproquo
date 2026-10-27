import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetPendingEventsEffect } from '../effects/EventDocWorkspaceSetPendingEventsEffect';

/** Replaces a slot's pending buffer wholesale. */
export function* askUIEventDocWorkspaceSetPendingEvents(slotKey: string, events: EventDocEvent[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetPendingEventsEffect>(EventDocWorkspaceEffect.SetPendingEvents, { slotKey, events });
}

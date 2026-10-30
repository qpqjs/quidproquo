import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceAppendHistoryEventEffect } from '../effects/EventDocWorkspaceAppendHistoryEventEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Appends one saved event to a slot's history. */
export function* askEventDocWorkspaceAppendHistoryEvent(slotKey: string, event: EventDocEvent): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceAppendHistoryEventEffect>(EventDocWorkspaceEffect.AppendHistoryEvent, { slotKey, event });
}

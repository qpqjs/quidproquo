import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceRemovePendingEventEffect } from '../effects/EventDocWorkspaceRemovePendingEventEffect';

/** Removes one acked event from a pending buffer by clientMessageId. */
export function* askUIEventDocWorkspaceRemovePendingEvent(slotKey: string, clientMessageId: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceRemovePendingEventEffect>(EventDocWorkspaceEffect.RemovePendingEvent, {
    slotKey,
    clientMessageId,
  });
}

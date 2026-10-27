import { AskResponse, Nullable } from 'quidproquo-core';

import { askUIEventDocWorkspaceSetPendingEvents } from '../actionCreators/askUIEventDocWorkspaceSetPendingEvents';
import { EventDocWorkspaceSnapshot } from '../types/EventDocWorkspaceSnapshot';

/**
 * Restores a snapshot's local-slot streams into a fresh runtime, replacing pending wholesale. Unknown keys and a missing
 * localSlots restore nothing.
 */
export function* askEventDocWorkspaceRestoreLocalPending(snapshot: Nullable<EventDocWorkspaceSnapshot>, localSlotKeys: string[]): AskResponse<void> {
  for (const [slotKey, pending] of Object.entries(snapshot?.localSlots ?? {})) {
    if (localSlotKeys.includes(slotKey) && pending.length > 0) {
      yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, pending);
    }
  }
}

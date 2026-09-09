import { replayEffects } from 'quidproquo-core';

import { foldEventDocLiveView } from '../../fold/foldEventDocLiveView';
import { EventDocDocument, EventDocEvent } from '../../models';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';

/**
 * Folds an unsaved tail onto a stored view. Document slots go through the shared live fold (version guard, then migrate to
 * latest, so the result is always latest-shaped); local slots are plain replays.
 */
export const foldSlotPendingTail = (slot: EventDocWorkspaceSlotFoldConfig, view: unknown, pending: EventDocEvent[]): unknown => {
  if (slot.kind !== EventDocWorkspaceSlotKind.document) {
    return replayEffects(view, slot.foldReducer, pending);
  }

  return foldEventDocLiveView(view as EventDocDocument, pending, {
    reducer: slot.foldReducer,
    migrations: slot.migrations ?? {},
    latestVersion: slot.schemaVersion ?? 1,
  });
};

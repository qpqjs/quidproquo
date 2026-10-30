import { createInitialEventDocWorkspaceState } from '../logic/createInitialEventDocWorkspaceState';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** Returns the pristine state for the same slots, reseeding each slot's initial history view. */
export const createResetUpdater = (slots: EventDocWorkspaceSlotFoldsConfig) => (): EventDocWorkspaceState =>
  createInitialEventDocWorkspaceState(slots);

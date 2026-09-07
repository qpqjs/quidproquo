import { EventDocWorkspaceSetSavingPayload } from '../../effects/EventDocWorkspaceSetSavingEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { updateSlotState } from './updateSlotState';

/** Sets a slot's saving flag. */
export const setSaving = (state: EventDocWorkspaceState, { slotKey, isSaving }: EventDocWorkspaceSetSavingPayload): EventDocWorkspaceState =>
  updateSlotState(state, slotKey, { isSaving });

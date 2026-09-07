import { EventDocWorkspaceSetDocumentIdentityPayload } from '../../effects/EventDocWorkspaceSetDocumentIdentityEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { updateSlotState } from './updateSlotState';

/** Binds a slot to a document. */
export const setDocumentIdentity = (
  state: EventDocWorkspaceState,
  { slotKey, documentIdentity }: EventDocWorkspaceSetDocumentIdentityPayload,
): EventDocWorkspaceState => updateSlotState(state, slotKey, { documentIdentity });

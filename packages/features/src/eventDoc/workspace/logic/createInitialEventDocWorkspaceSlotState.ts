import { EventDocWorkspaceSlotState } from '../types/EventDocWorkspaceSlotState';

/** Initial slot status. */
export const createInitialEventDocWorkspaceSlotState = (): EventDocWorkspaceSlotState => ({
  documentIdentity: null,
  isLoading: false,
  isSaving: false,
  error: null,
});

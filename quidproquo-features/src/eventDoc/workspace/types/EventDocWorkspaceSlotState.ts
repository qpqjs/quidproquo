import { Nullable } from 'quidproquo-core';

import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSlotError } from './EventDocWorkspaceSlotError';

/** Per-slot status. documentIdentity is null for local slots and for document slots not yet initialised. */
export type EventDocWorkspaceSlotState = {
  documentIdentity: Nullable<EventDocWorkspaceDocumentIdentity>;
  isLoading: boolean;
  isSaving: boolean;
  error: Nullable<EventDocWorkspaceSlotError>;
};

/** Initial slot status. */
export const createInitialEventDocWorkspaceSlotState = (): EventDocWorkspaceSlotState => ({
  documentIdentity: null,
  isLoading: false,
  isSaving: false,
  error: null,
});

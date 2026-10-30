import { Nullable } from '@qpqjs/core';

import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSlotError } from './EventDocWorkspaceSlotError';

/** Per-slot status. documentIdentity is null for local slots and for document slots not yet initialised. */
export type EventDocWorkspaceSlotState = {
  documentIdentity: Nullable<EventDocWorkspaceDocumentIdentity>;
  isLoading: boolean;
  isSaving: boolean;
  error: Nullable<EventDocWorkspaceSlotError>;
};

import { EventDocWorkspaceDocumentSlotFoldConfig } from './EventDocWorkspaceDocumentSlotFoldConfig';
import { EventDocWorkspaceLocalSlotFoldConfig } from './EventDocWorkspaceLocalSlotFoldConfig';

/** Union constraint for fold-slot maps; `any` views for the same reason as EventDocWorkspaceSlotConfig. */
export type EventDocWorkspaceSlotFoldConfig = EventDocWorkspaceDocumentSlotFoldConfig<any> | EventDocWorkspaceLocalSlotFoldConfig<any>;

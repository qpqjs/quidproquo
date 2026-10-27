import { EventDocWorkspaceDocumentSlotConfig } from './EventDocWorkspaceDocumentSlotConfig';
import { EventDocWorkspaceLocalSlotConfig } from './EventDocWorkspaceLocalSlotConfig';

/**
 * Union constraint for slot maps. `any` views on purpose: reducer state params are contravariant, so concrete views would
 * break assignability. Per-slot types are recovered with EventDocWorkspaceSlotViewOf / EventDocWorkspaceSlotApiOf.
 */
export type EventDocWorkspaceSlotConfig = EventDocWorkspaceDocumentSlotConfig<any, any> | EventDocWorkspaceLocalSlotConfig<any, any>;

import { EventDocWorkspaceSlotsConfig } from './EventDocWorkspaceSlotsConfig';
import { EventDocWorkspaceTransport } from './EventDocWorkspaceTransport';

/** Input to createEventDocWorkspace. */
export type EventDocWorkspaceDefinition<TSlots extends EventDocWorkspaceSlotsConfig> = {
  slots: TSlots;
  // Only needed when the workspace has document slots to load or save.
  transport?: EventDocWorkspaceTransport;
};

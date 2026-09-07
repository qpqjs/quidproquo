import { CoalesceEventType } from './CoalesceEventType';
import { EventDocWorkspaceSlotFoldConfigBase } from './EventDocWorkspaceSlotFoldConfigBase';
import { EventDocWorkspaceSlotKind } from './EventDocWorkspaceSlotKind';

/** A local slot's api-free fold config. */
export type EventDocWorkspaceLocalSlotFoldConfig<TView = unknown> = EventDocWorkspaceSlotFoldConfigBase<TView> & {
  kind: EventDocWorkspaceSlotKind.local;
  // Omitted means every type coalesces last-write-wins.
  coalesceEventTypes?: CoalesceEventType[];
};

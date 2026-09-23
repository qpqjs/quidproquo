import { EventDocMigrations } from '../../fold';
import { EventDocDocument } from '../../models';
import { EventDocEventValidators } from '../../validation/types/EventDocEventValidators';
import { CoalesceEventType } from './CoalesceEventType';
import { EventDocWorkspaceSlotFoldConfigBase } from './EventDocWorkspaceSlotFoldConfigBase';
import { EventDocWorkspaceSlotKind } from './EventDocWorkspaceSlotKind';

/** A document slot's api-free fold config. */
export type EventDocWorkspaceDocumentSlotFoldConfig<TView extends EventDocDocument = EventDocDocument> =
  EventDocWorkspaceSlotFoldConfigBase<TView> & {
    kind: EventDocWorkspaceSlotKind.document;
    migrations?: EventDocMigrations;
    // The key a usable fold base must carry (see EventDocSavedDefinitionConfig.snapshotCacheKey). A held base filed under
    // another key is stale fold output and is refetched. Absent (a slot with no saved definition) reads as ''.
    getSnapshotCacheKey?: () => string;
    // Merged after the reserved field-setter rules.
    coalesceEventTypes?: CoalesceEventType[];
    // The fully merged registry (reserved + the collection's own), so the live fold rejects exactly what the saved fold rejects.
    validators?: EventDocEventValidators<TView>;
  };

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
    // Merged after the reserved field-setter rules.
    coalesceEventTypes?: CoalesceEventType[];
    // The fully merged registry (reserved + the collection's own), so the live fold rejects exactly what the saved fold rejects.
    validators?: EventDocEventValidators<TView>;
  };

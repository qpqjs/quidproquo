import { QpqReducer } from 'quidproquo-core';

import { EventDocMigration } from '../../fold/EventDocMigration';
import { EventDocDocument, EventDocEvent } from '../../models';

/**
 * A view at any version above the base: it has a predecessor and no seed. `migrateFromPrevious` is required even when
 * the shape did not change (pass `(state) => state`): an explicit no-op is evidence the view was considered.
 */
export type EventDocNextViewVersion<TView extends EventDocDocument = EventDocDocument> = {
  foldReducer: QpqReducer<TView, EventDocEvent>;
  // Maps the previous version's state onto this one's. The fold stamps schemaVersion, so a migration only transforms data fields.
  migrateFromPrevious: EventDocMigration;
};

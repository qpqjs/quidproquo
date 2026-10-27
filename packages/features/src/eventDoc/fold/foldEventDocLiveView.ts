import { QpqReducer } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../models';
import { EventDocMigrations } from './EventDocMigrations';
import { foldEventDocLogStep } from './foldEventDocLogStep';
import { migrateEventDocDocumentTo } from './migrateEventDocDocumentTo';

/** The step config for the read-side fold. */
export type FoldEventDocLiveViewConfig<TState extends EventDocDocument> = {
  reducer: QpqReducer<TState, EventDocEvent>;
  migrations: EventDocMigrations;
  latestVersion: number;
};

/**
 * The read-side fold: apply the pending tail onto a stored accumulator, then migrate to latest. The accumulator sits at
 * its last folded event's version, so the final migrate is what makes every read latest-shaped, even with no pending.
 * Pending versions must be non-decreasing (the rule the append enforces); a lower one throws rather than corrupt the view.
 */
export const foldEventDocLiveView = <TState extends EventDocDocument>(
  base: EventDocDocument,
  pending: EventDocEvent[],
  { reducer, migrations, latestVersion }: FoldEventDocLiveViewConfig<TState>,
): TState => {
  let state: EventDocDocument = base;
  // No floor for a pristine base (empty id): a latest-shaped seed with no events must not reject an old-version tail.
  let versionFloor = base.id !== '' ? base.schemaVersion : 0;

  for (const event of pending) {
    const eventVersion = event.payload.metadata.version;

    if (eventVersion < versionFloor) {
      throw new Error(
        `Cannot fold pending event '${event.type}' at schema version ${eventVersion} - the document has already folded to version ${versionFloor}; pending event versions must be non-decreasing.`,
      );
    }

    versionFloor = eventVersion;
    [state] = foldEventDocLogStep(state, event, { reducer, migrations, latestVersion });
  }

  return migrateEventDocDocumentTo(state, latestVersion, migrations) as TState;
};

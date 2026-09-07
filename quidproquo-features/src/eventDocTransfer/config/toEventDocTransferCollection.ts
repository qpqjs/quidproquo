import { getEventDocFunctionsIdentity } from '../../eventDoc/definition/getEventDocFunctionsIdentity';
import { EventDocFunctions } from '../../eventDoc/definition/types/EventDocFunctions';
import { EventDocTransferCollection } from '../models';

/** A transferable collection: a collection-list entry carrying `functions`, the functions object itself, or a bare registry entry. */
export type EventDocTransferCollectionSource = EventDocFunctions | { functions: EventDocFunctions } | EventDocTransferCollection;

const isEventDocFunctions = (source: EventDocTransferCollectionSource): source is EventDocFunctions =>
  typeof (source as EventDocFunctions).foldSnapshotViews === 'function';

/** Normalises any EventDocTransferCollectionSource to a registry entry. */
export const toEventDocTransferCollection = (source: EventDocTransferCollectionSource): EventDocTransferCollection => {
  if ('functions' in source) {
    return getEventDocFunctionsIdentity(source.functions);
  }

  if (isEventDocFunctions(source)) {
    return getEventDocFunctionsIdentity(source);
  }

  return source;
};

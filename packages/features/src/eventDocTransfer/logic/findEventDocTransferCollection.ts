import { Nullable } from 'quidproquo-core';

import { EventDocDocRef, EventDocTransferCollection, EventDocTransferRegistry } from '../models';

/** The registered collection a doc ref addresses, or null for another service or an unregistered type (callers must fail on null). */
export const findEventDocTransferCollection = (registry: EventDocTransferRegistry, ref: EventDocDocRef): Nullable<EventDocTransferCollection> => {
  if (ref.service !== registry.service) {
    return null;
  }

  return registry.collections.find((collection) => collection.type === ref.type) ?? null;
};

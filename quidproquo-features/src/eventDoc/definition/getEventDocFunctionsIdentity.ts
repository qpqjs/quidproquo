import { EventDocFunctions } from './types/EventDocFunctions';

/** The {storeName, type} pair a collection is registered under. */
export type EventDocFunctionsIdentity = {
  storeName: string;
  type: string;
};

/**
 * The identity off a live EventDocFunctions object. Identity is optional on the type (client-only definitions), but a
 * collection being registered, transferred or migrated must have one; throws when either half is missing.
 */
export const getEventDocFunctionsIdentity = ({ storeName, type }: EventDocFunctions): EventDocFunctionsIdentity => {
  if (!storeName || !type) {
    throw new Error('EventDocFunctions object has no identity - set storeName and type on its definition.');
  }

  return { storeName, type };
};

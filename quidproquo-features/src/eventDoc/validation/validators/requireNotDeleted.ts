import { EventDocEventValidator } from '../types/EventDocEventValidator';

/** A deleted document accepts nothing but RESTORE. Also on DELETE itself, so deleting twice is rejected. */
export const requireNotDeleted: EventDocEventValidator = (_event, state) =>
  state.deletedAt === undefined ? null : 'The document is deleted — restore it first.';

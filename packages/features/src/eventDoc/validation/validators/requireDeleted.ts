import { EventDocEventValidator } from '../types/EventDocEventValidator';

/** RESTORE only means something on a deleted document. */
export const requireDeleted: EventDocEventValidator = (_event, state) => (state.deletedAt !== undefined ? null : 'The document is not deleted.');

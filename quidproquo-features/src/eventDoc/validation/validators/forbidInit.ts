import { EventDocEventValidator } from '../types/EventDocEventValidator';

/**
 * A document may be initialised once. Read off the id rather than a flat refusal: during a fold the log's opening
 * INIT_STATE must apply (the seed leaves id empty), while at append time the document exists and any INIT is a re-init.
 */
export const forbidInit: EventDocEventValidator = (_event, state) => (state.id ? 'Cannot re-initialise an existing document.' : null);

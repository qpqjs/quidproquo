import { createEventDocEventValidator } from './createEventDocEventValidator';

/** The validator a collection gets with no domain rules: just the reserved lifecycle guard. */
export const defaultEventDocEventValidator = createEventDocEventValidator();

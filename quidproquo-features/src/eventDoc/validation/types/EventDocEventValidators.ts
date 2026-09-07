import { EventDocDocument } from '../../models';
import { EventDocEventValidator } from './EventDocEventValidator';

/** Validators keyed by event type, with a '*' fallback for any type without its own entry. */
export type EventDocEventValidators<S extends EventDocDocument = EventDocDocument> = Record<string, EventDocEventValidator<S>>;

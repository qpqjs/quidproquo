import type { EventDocEvent } from '../../models';
import type { EventDocStoredEvent } from '../../types/EventDocStoredEvent';

/** Unwraps a stored row; the event is stored verbatim in `data`. */
export const eventDocStoredEventToEvent = <T = unknown>(record: EventDocStoredEvent): EventDocEvent<T> => record.data as EventDocEvent<T>;

import { Nullable } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../../models';

/**
 * A pure rule for one event type: given the event and the state folded from prior events, null to allow or a reason.
 * `TData` is the effect's payload data, so a rule reads `event.payload.data` typed without a cast.
 */
export type EventDocEventValidator<S extends EventDocDocument = EventDocDocument, TData = unknown> = (
  event: EventDocEvent<TData>,
  state: S,
) => Nullable<string>;

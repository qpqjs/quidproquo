import { Nullable } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../../models';

/** A pure rule for one event type: given the event and the state folded from prior events, null to allow or a reason. */
export type EventDocEventValidator<S extends EventDocDocument = EventDocDocument> = (event: EventDocEvent, state: S) => Nullable<string>;

import { Nullable } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../models';
import { EventDocEventValidators } from './types/EventDocEventValidators';

const WILDCARD = '*';

/** Run the registry entry for the event's type, falling back to '*'. Returns the rejection reason or null. */
export const validateEventDocEvent = <S extends EventDocDocument>(
  validators: EventDocEventValidators<S>,
  event: EventDocEvent,
  state: S,
): Nullable<string> => (validators[event.type] ?? validators[WILDCARD])?.(event, state) ?? null;

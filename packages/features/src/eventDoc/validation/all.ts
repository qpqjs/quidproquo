import { Nullable } from '@qpqjs/core';

import { EventDocDocument } from '../models';
import { EventDocEventValidator } from './types/EventDocEventValidator';

/** Compose validators left-to-right, returning the first failure or null. */
export const all =
  <S extends EventDocDocument>(...validators: EventDocEventValidator<S>[]): EventDocEventValidator<S> =>
  (event, state) =>
    validators.reduce<Nullable<string>>((reason, validate) => reason ?? validate(event, state), null);

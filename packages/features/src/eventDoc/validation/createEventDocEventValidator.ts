import { EventDocDocument } from '../models';
import { EventDocEditorValidator } from './types/EventDocEditorValidator';
import { EventDocEventValidators } from './types/EventDocEventValidators';
import { reservedEventDocEventValidators } from './reservedEventDocEventValidators';
import { validateEventDocEvent } from './validateEventDocEvent';

/**
 * Builds a collection's editor validator from its domain rules with the reserved lifecycle guard merged in first, so a
 * domain entry can add rules or relax a reserved one. The caller supplies the folded state; there is no fold in here.
 */
export const createEventDocEventValidator =
  <S extends EventDocDocument>(domainValidators: EventDocEventValidators<S> = {}): EventDocEditorValidator =>
  (event, state) =>
    validateEventDocEvent({ ...reservedEventDocEventValidators, ...domainValidators }, event, state as S);

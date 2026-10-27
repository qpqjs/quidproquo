import { EventDocStatus } from '../../models';
import { EventDocEventValidator } from '../types/EventDocEventValidator';

/** CREATE_DRAFT branches off a published document; rejected while a draft is already open. */
export const requirePublished: EventDocEventValidator = (_event, state) =>
  state.status === EventDocStatus.Published ? null : 'A draft is already open — publish it before creating another.';

import { EventDocStatus } from '../../models';
import { EventDocEventValidator } from '../types/EventDocEventValidator';

/** Edits are only legal on an open draft. The '*' default for every non-lifecycle event. */
export const requireDraft: EventDocEventValidator = (_event, state) =>
  state.status === EventDocStatus.Draft ? null : 'Create a draft first — the document is published.';

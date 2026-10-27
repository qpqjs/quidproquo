import { Nullable } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../models';
import { EventDocEventValidators } from '../validation/types/EventDocEventValidators';
import { validateEventDocEvent } from '../validation/validateEventDocEvent';

/**
 * Decide whether one event may be folded onto `state` (the document as of the accepted events before it). Returns the
 * rejection reason, or null. The verdict depends only on the event, that state and the registry, never on later events,
 * so a fold resuming from a snapshot reaches the same verdicts as one from scratch.
 */
export const rejectEventDocEvent = <S extends EventDocDocument>(
  event: EventDocEvent,
  state: S,
  validators?: EventDocEventValidators<S>,
): Nullable<string> => {
  const { clientMessageId, version } = event.payload.metadata;

  // The dedup window lives on the state rather than in loop bookkeeping so a resumed fold sees the same history.
  if (clientMessageId && state.recentClientMessageIds?.includes(clientMessageId)) {
    return `Duplicate clientMessageId ${clientMessageId}`;
  }

  // No floor for a pristine state (no INIT_STATE yet, empty id): a latest-shaped seed with no events must not reject an old log.
  if (state.id !== '' && version < state.schemaVersion) {
    return `Event version ${version} is older than the document's version ${state.schemaVersion}`;
  }

  return validators ? validateEventDocEvent(validators, event, state) : null;
};

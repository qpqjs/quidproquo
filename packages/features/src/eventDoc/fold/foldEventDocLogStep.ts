import { QpqReducer } from 'quidproquo-core';

import { EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW } from '../constants/eventDocRecentClientMessageIdWindow';
import { EventDocDocument, EventDocEvent } from '../models';
import { EventDocEventValidators } from '../validation/types/EventDocEventValidators';
import { rejectEventDocEvent } from './acceptEventDocEvent';
import { EventDocMigrations } from './EventDocMigrations';
import { migrateEventDocDocumentTo } from './migrateEventDocDocumentTo';

/** Per-event fold config. */
export type FoldEventDocLogStepConfig<TState extends EventDocDocument> = {
  reducer: QpqReducer<TState, EventDocEvent>;
  migrations: EventDocMigrations;
  latestVersion: number;

  // Omitted = only the state-based rules (dedup, version floor) apply, which is what re-deriving an already-vetted slice wants.
  validators?: EventDocEventValidators<TState>;
};

/**
 * Fold one event: migrate the state up to the event's version (clamped to latestVersion), decide acceptance, apply the
 * version-routed reducer, stamp updatedAt and the rolling dedup window. Returns [state, accepted]. A rejected event
 * returns the accumulator untouched: not updatedAt, not the dedup window, so it cannot shadow a later valid event's id.
 */
export const foldEventDocLogStep = <TState extends EventDocDocument>(
  state: EventDocDocument,
  event: EventDocEvent,
  { reducer, migrations, latestVersion, validators }: FoldEventDocLogStepConfig<TState>,
): [EventDocDocument, boolean] => {
  const target = Math.min(event.payload.metadata.version, latestVersion);

  let next: EventDocDocument = migrateEventDocDocumentTo(state, target, migrations);

  if (rejectEventDocEvent(event, next as TState, validators)) {
    return [state, false];
  }

  [next] = reducer(next as TState, event);

  const { clientMessageId, createdAt } = event.payload.metadata;
  const accepted: EventDocDocument = { ...next, updatedAt: createdAt };

  if (clientMessageId) {
    accepted.recentClientMessageIds = [...(next.recentClientMessageIds ?? []), clientMessageId].slice(-EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW);
  }

  return [accepted, true];
};

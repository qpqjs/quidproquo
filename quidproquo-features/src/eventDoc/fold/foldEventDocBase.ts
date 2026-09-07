import { QpqReducer } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../models';
import { reservedEventDocEventValidators } from '../validation/reservedEventDocEventValidators';
import { buildEventDocBaseReducer } from './buildEventDocBaseReducer';
import { createEventDocInitialDocumentState } from './createEventDocInitialDocumentState';
import { foldEventDocLog } from './foldEventDocLog';

// The base document is schema-version-agnostic, so this fold pins version 1 with no migrations.
const baseSeed = (): EventDocDocument => createEventDocInitialDocumentState(1);

const baseReducer = buildEventDocBaseReducer(baseSeed) as QpqReducer<EventDocDocument, EventDocEvent>;

/**
 * Folds only the reserved events into the base EventDocDocument fields, validated with the reserved registry; domain
 * events bubble unhandled but still advance updatedAt. `seedState` resumes from a snapshot's document state; its
 * documentVersion is clamped to 1 because this fold's whole universe is version 1 (each event's version is clamped too).
 */
export const foldEventDocBase = (events: EventDocEvent[], seedState?: unknown): EventDocDocument =>
  foldEventDocLog(events, {
    seed: seedState ? { ...(seedState as EventDocDocument), documentVersion: 1 } : baseSeed(),
    reducer: baseReducer,
    migrations: {},
    latestVersion: 1,
    validators: reservedEventDocEventValidators,
  });

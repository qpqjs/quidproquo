import { Nullable } from '@qpqjs/core';

import { EventDocDocument, EventDocEvent, EventDocListViewState } from '../models';
import { reservedEventDocEventValidators } from '../validation/reservedEventDocEventValidators';
import { foldEventDocLogAsWritten, FoldEventDocLogConfig } from './foldEventDocLog';

/**
 * One list view's state after `events`, resumed from `seedState` (a lists store row's state) or from the view's own
 * seed. Era-pinned, like a snapshot, so the result is a seed for the next call. Trusted events already passed the
 * append gate, so only the state-based rules (dedup, version floor) apply; untrusted ones also meet the reserved
 * lifecycle guard, which reads nothing but base fields every view carries.
 */
export const foldEventDocListView = <TState extends EventDocDocument>(
  foldConfig: FoldEventDocLogConfig<TState>,
  events: EventDocEvent[],
  seedState: Nullable<unknown>,
  trusted: boolean,
): EventDocListViewState => {
  // A stored row's state was written by this same fold, so the cast restates provenance.
  const seeded = seedState !== undefined && seedState !== null ? { ...foldConfig, seed: seedState as TState } : foldConfig;

  return foldEventDocLogAsWritten(events, trusted ? seeded : { ...seeded, validators: reservedEventDocEventValidators }).state;
};

import { EventDocDocument, EventDocEvent } from '../models';
import { foldEventDocLogStep, FoldEventDocLogStepConfig } from './foldEventDocLogStep';
import { migrateEventDocDocumentTo } from './migrateEventDocDocumentTo';

/** The step config plus a seed. INIT_STATE overwrites the seed, so it only matters for an empty log. */
export type FoldEventDocLogConfig<TState extends EventDocDocument> = FoldEventDocLogStepConfig<TState> & {
  seed: TState;
};

/**
 * Fold a whole log, migrating the accumulator up to each event's version before folding it and climbing to
 * latestVersion at the end. Acceptance (dedup, version floor, `validators`) skips a rejected event silently; it is
 * defence in depth behind the append path's pre-write gate, and a verdict is fixed once its predecessors are known.
 */
export const foldEventDocLog = <TState extends EventDocDocument>(events: EventDocEvent[], config: FoldEventDocLogConfig<TState>): TState =>
  foldEventDocLogAccepted(events, config).state;

/**
 * The same fold, also reporting which events were accepted. Secondary views fold this set rather than the raw log, so
 * every view of a log sees the identical event set.
 */
export const foldEventDocLogAccepted = <TState extends EventDocDocument>(
  events: EventDocEvent[],
  config: FoldEventDocLogConfig<TState>,
): { state: TState; accepted: EventDocEvent[] } => {
  const { state, accepted } = foldEventDocLogAsWritten(events, config);

  return { state: migrateEventDocDocumentTo(state, config.latestVersion, config.migrations) as TState, accepted };
};

/**
 * The same fold without the final climb: the state comes out at the version the log actually reached. This is what
 * snapshots store, and the correct seed for resuming a fold: its schemaVersion is the true accepted floor, where a
 * latest-climbed state would reject old-version events a from-scratch fold accepts.
 */
export const foldEventDocLogAsWritten = <TState extends EventDocDocument>(
  events: EventDocEvent[],
  { seed, reducer, migrations, latestVersion, validators }: FoldEventDocLogConfig<TState>,
): { state: TState; accepted: EventDocEvent[] } => {
  let state: EventDocDocument = { ...seed };
  const accepted: EventDocEvent[] = [];

  for (const event of events) {
    const [next, wasAccepted] = foldEventDocLogStep(state, event, { reducer, migrations, latestVersion, validators });

    state = next;
    if (wasAccepted) {
      accepted.push(event);
    }
  }

  return { state: state as TState, accepted };
};

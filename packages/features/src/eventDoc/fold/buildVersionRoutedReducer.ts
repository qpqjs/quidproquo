import { QpqReducer } from 'quidproquo-core';

import { EventDocEvent } from '../models';

/**
 * Dispatch on event.payload.metadata.version. Does not reconcile state shapes: the caller migrates the accumulator up
 * first. An event at a version with no reducer throws; a silent skip would read as a document that stopped changing.
 */
export const buildVersionRoutedReducer =
  <TState>(reducersByVersion: Record<number, QpqReducer<TState, EventDocEvent>>): QpqReducer<TState, EventDocEvent> =>
  (state, effect) => {
    const version = effect?.payload?.metadata?.version;
    const reducer = version == null ? undefined : reducersByVersion[version];

    if (!reducer) {
      throw new Error(
        `No event-doc fold reducer for schema version ${String(version)} (registered: ${Object.keys(reducersByVersion).join(', ') || 'none'}).`,
      );
    }

    return reducer(state, effect);
  };

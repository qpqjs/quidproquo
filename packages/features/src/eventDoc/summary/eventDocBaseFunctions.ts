import { Nullable } from '@qpqjs/core';

import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { foldEventDocListView } from '../fold/foldEventDocListView';
import { EventDocEvent, EventDocListViewState } from '../models';
import { EVENT_DOC_SUMMARY_FOLD_CONFIG } from './logic/eventDocSummaryFoldConfig';

/**
 * The list view members of a collection's functions, for a collection with no registered definition: its one list
 * view is the summary, folded by the same reducer a definition folds it with. The logic layer falls back to these, so
 * a collection without a definition still runs the code every other collection runs.
 */
export const eventDocBaseFunctions = {
  /** The one list view a collection has without a definition. */
  getListViewNames: (): string[] => [EVENT_DOC_SUMMARY_VIEW],

  /** The summary after `events`, resumed from a stored row's state; null for any other view. */
  foldListView: (viewName: string, events: EventDocEvent[], seedState: unknown, trusted: boolean): Nullable<EventDocListViewState> =>
    viewName === EVENT_DOC_SUMMARY_VIEW ? foldEventDocListView(EVENT_DOC_SUMMARY_FOLD_CONFIG, events, seedState, trusted) : null,

  /** The states as stored: the summary has one shape at every schema version, so there is nothing to climb. */
  migrateListViewStates: (_viewName: string, states: unknown[]): unknown[] => states,
};

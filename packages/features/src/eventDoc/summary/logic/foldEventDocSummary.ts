import { foldEventDocListView } from '../../fold/foldEventDocListView';
import { EventDocEvent, EventDocSummaryView } from '../../models';
import { EVENT_DOC_SUMMARY_FOLD_CONFIG } from './eventDocSummaryFoldConfig';

/**
 * Fold a whole log into the summary view without a doc type's definition, under the rules a view can judge alone
 * (dedup, version floor, the reserved lifecycle guard). For code that only has the events: a transfer bundle, a
 * collection with nothing registered.
 */
export const foldEventDocSummary = (events: EventDocEvent[]): EventDocSummaryView =>
  foldEventDocListView(EVENT_DOC_SUMMARY_FOLD_CONFIG, events, null, false) as EventDocSummaryView;

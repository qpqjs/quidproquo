import { AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocEvent, EventDocSummary, EventDocSummaryView } from '../models';
import { askEventDocListViewsRefold } from './askEventDocListViewsRefold';

/**
 * Bring every list view's row up to the last appended event before the append returns, so a reader that follows it
 * sees it; the stream projector rewrites the rows after. `trusted` says the events passed the append gate. Returns the
 * refolded summary for the append's hooks, or null when it could not be refolded.
 */
export function* askEventDocAppendRefold(modelId: string, events: EventDocEvent[], trusted: boolean): AskResponse<Nullable<EventDocSummary>> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const states = yield* askEventDocListViewsRefold(modelId, events, trusted);
  const summary = states[EVENT_DOC_SUMMARY_VIEW];

  // The summary view's fold produced this state, so the cast restates provenance.
  return summary ? { ...(summary as EventDocSummaryView), type } : null;
}

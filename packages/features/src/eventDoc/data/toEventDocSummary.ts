import { EventDocSummary, EventDocSummaryView } from '../models';
import { EventDocStoredListView } from '../types/EventDocStoredListView';

/** The summary a lists store row holds, with the collection's `type` stamped on as the summary's consumers expect. */
export const toEventDocSummary = <T extends EventDocSummary = EventDocSummary>(row: EventDocStoredListView, type: string): T =>
  // The summary fold wrote this state, so the cast restates provenance.
  ({ ...(row.state as EventDocSummaryView), type }) as T;

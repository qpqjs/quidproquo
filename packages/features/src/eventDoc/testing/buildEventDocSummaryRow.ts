import { eventDocListViewPk } from '../data/eventDocListViewPk';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummaryView } from '../models';
import { EventDocStoredListView } from '../types/EventDocStoredListView';

/** A summary as the lists store holds it, for tests that seed or inspect a collection's rows. `eventId` defaults to the summary's own. */
export const buildEventDocSummaryRow = (type: string, summary: EventDocSummaryView, eventId: number = summary.eventId): EventDocStoredListView => ({
  pk: eventDocListViewPk(EVENT_DOC_SUMMARY_VIEW, type),
  id: summary.id,
  updatedAt: summary.updatedAt,
  ...(summary.deletedAt !== undefined ? { deletedAt: summary.deletedAt } : {}),
  eventId,
  state: summary,
});

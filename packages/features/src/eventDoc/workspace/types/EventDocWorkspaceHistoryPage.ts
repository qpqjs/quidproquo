import { EventDocEvent } from '../../models';

/** Display-only newest-first pages of the saved log; an absent nextPageKey means the log's beginning was reached. */
export type EventDocWorkspaceHistoryPage = {
  events: EventDocEvent[];
  nextPageKey?: string;
};

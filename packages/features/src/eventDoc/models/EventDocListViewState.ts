import { QpqIsoDateTime } from '@qpqjs/core';

/**
 * The fields every list view state carries, whatever else it holds: the lists store copies them onto the row so a
 * collection can be read newest first with soft-deleted documents left out. The summary and every declared view have them.
 */
export type EventDocListViewState = {
  id: string;
  updatedAt: QpqIsoDateTime;
  deletedAt?: QpqIsoDateTime;
};

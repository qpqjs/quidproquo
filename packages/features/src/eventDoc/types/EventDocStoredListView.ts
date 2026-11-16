import { QpqIsoDateTime } from '@qpqjs/core';

/**
 * A lists store row: pk=viewName#type, sk=id, so one query reads a page of one list view across a collection.
 * `updatedAt` and `deletedAt` are copied out of `state` because the index sorts on one and the list filters on the other.
 * `eventId` is the event the row is folded through; its writers compare it, so a row never moves backwards.
 * `state` is the view as folded (not climbed to the latest schema), which is what makes it a seed for the next event.
 */
export type EventDocStoredListView = {
  pk: string;
  id: string;
  updatedAt: QpqIsoDateTime;
  deletedAt?: QpqIsoDateTime;
  eventId: number;
  state: unknown;
};

import { QpqIsoDateTime } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

/** A flattened, display-ready view of an EventDocSummary for a list row. */
export type EventDocListItem = {
  id: string;
  type: string;
  name: string;
  // Highest version number, or null when there are no versions yet.
  version: Nullable<number>;
  hasDraft: boolean;
  updatedAt: QpqIsoDateTime;
  updatedBy: string;
  createdAt: QpqIsoDateTime;
  createdBy: string;
};

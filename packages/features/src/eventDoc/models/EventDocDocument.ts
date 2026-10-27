import { QpqIsoDateTime } from 'quidproquo-core';

import type { EventDocStatus } from './EventDocStatus';

/** Base shape every folded document state intersects. */
export type EventDocDocument = {
  // The event-set/migration version, which decides the reducer that applies. Not the publish counter.
  schemaVersion: number;
  id: string;
  code: string;
  name: string;
  // The publish counter folded from lifecycle events.
  documentVersion: number;
  status: EventDocStatus;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;

  // Soft delete, folded from DELETE / RESTORE. Absent means live.
  deletedAt?: QpqIsoDateTime;
  deletedBy?: string;

  // Rolling window (newest last) of accepted clientMessageIds for retry dedup. Lives on the state so a fold resumed from a
  // snapshot reaches the same verdicts as one from scratch.
  recentClientMessageIds?: string[];
};

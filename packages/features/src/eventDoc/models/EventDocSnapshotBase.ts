/**
 * The document view's snapshot state at `eventId`, a reader's fold base. Schema-pinned (see EventDocSnapshot).
 * `snapshotCacheKey` is the key the row was filed under, so a base held across runtimes can be checked against the
 * definition it is about to seed; absent on bases written before the key existed (read as '').
 */
export type EventDocSnapshotBase = {
  eventId: number;
  state: unknown;
  snapshotCacheKey?: string;
};

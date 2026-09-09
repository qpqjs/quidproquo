/** The document view's snapshot state at `eventId`, a reader's fold base. Schema-pinned (see EventDocSnapshot). */
export type EventDocSnapshotBase = {
  eventId: number;
  state: unknown;
};

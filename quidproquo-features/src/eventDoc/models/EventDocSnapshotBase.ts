// The document view's stored snapshot state at one event, served to a reader as a fold
// base: fold everything after `eventId` on top of `state` and the result equals folding
// the whole log. The state is era-pinned (see EventDocSnapshot) — a reader wanting the
// latest shape migrates it up, exactly as the fold does for any stored accumulator.
export type EventDocSnapshotBase = {
  eventId: number;
  state: unknown;
};

import { EventDocSnapshotViews } from './EventDocSnapshotViews';

/** A complete per-view snapshot set at one event for resuming the projector's fold. Never partial. */
export type EventDocSnapshotSeed = {
  eventId: number;
  views: EventDocSnapshotViews;
};

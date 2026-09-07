import { EventDocSnapshotViews } from './EventDocSnapshotViews';

// A complete snapshot loaded back for resuming the fold: every view's state as of one
// event. Only ever constructed whole — a snapshot with a missing view resolves to null
// instead, because a partial seed would fold the absent view from nothing.
export type EventDocSnapshotSeed = {
  eventId: number;
  views: EventDocSnapshotViews;
};

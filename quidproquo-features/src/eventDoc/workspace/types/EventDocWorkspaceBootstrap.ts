import { Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';

/** A document slot's opening load: the newest snapshot base plus the events after it. A null base means `events` is the whole log. */
export type EventDocWorkspaceBootstrap = {
  base: Nullable<EventDocSnapshotBase>;
  events: EventDocEvent[];
};

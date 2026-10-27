import { Effect, Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Replaces the slot's saved log together with the fold base it follows from; a null base means the events are the whole log. */
export type EventDocWorkspaceSetHistoryEventsPayload = {
  slotKey: string;
  events: EventDocEvent[];
  base?: Nullable<EventDocSnapshotBase>;
};

/** Replaces a slot's saved log and base. */
export type EventDocWorkspaceSetHistoryEventsEffect = Effect<EventDocWorkspaceEffect.SetHistoryEvents, EventDocWorkspaceSetHistoryEventsPayload>;

import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** A refreshed tail of server events; the reducer folds only these into the stored history view. */
export type EventDocWorkspaceAppendHistoryEventsPayload = {
  slotKey: string;
  events: EventDocEvent[];
};

/** Appends a refreshed tail to a slot's history. */
export type EventDocWorkspaceAppendHistoryEventsEffect = Effect<
  EventDocWorkspaceEffect.AppendHistoryEvents,
  EventDocWorkspaceAppendHistoryEventsPayload
>;

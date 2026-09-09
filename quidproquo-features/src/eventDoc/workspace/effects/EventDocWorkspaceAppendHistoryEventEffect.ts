import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** One server-stamped event that landed in the saved log. */
export type EventDocWorkspaceAppendHistoryEventPayload = {
  slotKey: string;
  event: EventDocEvent;
};

/** Appends one saved event to a slot's history. */
export type EventDocWorkspaceAppendHistoryEventEffect = Effect<
  EventDocWorkspaceEffect.AppendHistoryEvent,
  EventDocWorkspaceAppendHistoryEventPayload
>;

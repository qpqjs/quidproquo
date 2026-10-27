import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the SetPendingEvents effect. */
export type EventDocWorkspaceSetPendingEventsPayload = {
  slotKey: string;
  events: EventDocEvent[];
};

/** Replaces a slot's pending buffer wholesale. */
export type EventDocWorkspaceSetPendingEventsEffect = Effect<EventDocWorkspaceEffect.SetPendingEvents, EventDocWorkspaceSetPendingEventsPayload>;

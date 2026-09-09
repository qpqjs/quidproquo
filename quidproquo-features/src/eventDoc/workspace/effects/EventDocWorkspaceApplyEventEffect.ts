import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/**
 * A commit into the slot's pending buffer. Coalescing and the provisional eventId stamp happen in the reducer so parallel
 * commits cannot collide.
 */
export type EventDocWorkspaceApplyEventPayload = {
  slotKey: string;
  event: EventDocEvent;
};

/** Commits an event into a slot's pending buffer. */
export type EventDocWorkspaceApplyEventEffect = Effect<EventDocWorkspaceEffect.ApplyEvent, EventDocWorkspaceApplyEventPayload>;

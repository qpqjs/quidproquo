import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceSlotError } from '../types/EventDocWorkspaceSlotError';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the SetError effect. */
export type EventDocWorkspaceSetErrorPayload = {
  slotKey: string;
  error: EventDocWorkspaceSlotError;
};

/** Sets a slot's error. */
export type EventDocWorkspaceSetErrorEffect = Effect<EventDocWorkspaceEffect.SetError, EventDocWorkspaceSetErrorPayload>;

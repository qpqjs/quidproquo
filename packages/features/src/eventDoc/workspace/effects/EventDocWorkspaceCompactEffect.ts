import { Effect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the Compact effect. */
export type EventDocWorkspaceCompactPayload = {
  slotKey: string;
};

/** Moves a slot's base up to its last held event and empties its history. */
export type EventDocWorkspaceCompactEffect = Effect<EventDocWorkspaceEffect.Compact, EventDocWorkspaceCompactPayload>;

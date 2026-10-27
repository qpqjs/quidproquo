import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the ClearError effect. */
export type EventDocWorkspaceClearErrorPayload = {
  slotKey: string;
};

/** Clears a slot's error. */
export type EventDocWorkspaceClearErrorEffect = Effect<EventDocWorkspaceEffect.ClearError, EventDocWorkspaceClearErrorPayload>;

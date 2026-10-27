import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/**
 * Drops one transientKey (usually a websocket connection id) from every slot, so a dead connection takes all its
 * observations with it.
 */
export type EventDocWorkspaceDropTransientPayload = {
  transientKey: string;
};

/** Drops a transientKey across the workspace. */
export type EventDocWorkspaceDropTransientEffect = Effect<EventDocWorkspaceEffect.DropTransient, EventDocWorkspaceDropTransientPayload>;

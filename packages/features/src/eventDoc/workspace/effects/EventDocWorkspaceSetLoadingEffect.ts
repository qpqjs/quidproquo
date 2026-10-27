import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the SetLoading effect. */
export type EventDocWorkspaceSetLoadingPayload = {
  slotKey: string;
  isLoading: boolean;
};

/** Sets a slot's loading flag. */
export type EventDocWorkspaceSetLoadingEffect = Effect<EventDocWorkspaceEffect.SetLoading, EventDocWorkspaceSetLoadingPayload>;

import { Effect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the SetSaving effect. */
export type EventDocWorkspaceSetSavingPayload = {
  slotKey: string;
  isSaving: boolean;
};

/** Sets a slot's saving flag. */
export type EventDocWorkspaceSetSavingEffect = Effect<EventDocWorkspaceEffect.SetSaving, EventDocWorkspaceSetSavingPayload>;

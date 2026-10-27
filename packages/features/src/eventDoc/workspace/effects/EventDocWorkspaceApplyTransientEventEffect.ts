import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** A commit into the slot's transient group under `transientKey` (the drop unit). Never pending, never saved. */
export type EventDocWorkspaceApplyTransientEventPayload = {
  slotKey: string;
  transientKey: string;
  event: EventDocEvent;
};

/** Commits a transient event into a slot. */
export type EventDocWorkspaceApplyTransientEventEffect = Effect<
  EventDocWorkspaceEffect.ApplyTransientEvent,
  EventDocWorkspaceApplyTransientEventPayload
>;

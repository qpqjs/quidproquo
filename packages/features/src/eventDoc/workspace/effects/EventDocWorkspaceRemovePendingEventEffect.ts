import { Effect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the RemovePendingEvent effect. */
export type EventDocWorkspaceRemovePendingEventPayload = {
  slotKey: string;
  clientMessageId: string;
};

/** Removes one acked event from a pending buffer by clientMessageId. */
export type EventDocWorkspaceRemovePendingEventEffect = Effect<
  EventDocWorkspaceEffect.RemovePendingEvent,
  EventDocWorkspaceRemovePendingEventPayload
>;

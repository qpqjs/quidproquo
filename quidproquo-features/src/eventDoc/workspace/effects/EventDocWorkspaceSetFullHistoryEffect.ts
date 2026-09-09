import { Effect, Nullable } from 'quidproquo-core';

import { EventDocWorkspaceHistoryPage } from '../types/EventDocWorkspaceHistoryPage';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Replaces the slot's newest-first display history (null clears it). Nothing folds from it; the working history stays base + tail. */
export type EventDocWorkspaceSetFullHistoryPayload = {
  slotKey: string;
  history: Nullable<EventDocWorkspaceHistoryPage>;
};

/** Replaces a slot's display history. */
export type EventDocWorkspaceSetFullHistoryEffect = Effect<EventDocWorkspaceEffect.SetFullHistory, EventDocWorkspaceSetFullHistoryPayload>;

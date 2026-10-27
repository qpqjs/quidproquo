import { Effect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** One older newest-first page for the slot's display history; an absent `nextPageKey` means the log's beginning was reached. */
export type EventDocWorkspaceAppendFullHistoryPayload = {
  slotKey: string;
  events: EventDocEvent[];
  nextPageKey?: string;
};

/** Appends an older page to a slot's display history. */
export type EventDocWorkspaceAppendFullHistoryEffect = Effect<EventDocWorkspaceEffect.AppendFullHistory, EventDocWorkspaceAppendFullHistoryPayload>;

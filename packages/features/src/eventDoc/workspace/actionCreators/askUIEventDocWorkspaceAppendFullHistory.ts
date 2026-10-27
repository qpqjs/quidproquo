import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceAppendFullHistoryEffect } from '../effects/EventDocWorkspaceAppendFullHistoryEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Appends an older page to a slot's display history. */
export function* askUIEventDocWorkspaceAppendFullHistory(slotKey: string, events: EventDocEvent[], nextPageKey?: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceAppendFullHistoryEffect>(EventDocWorkspaceEffect.AppendFullHistory, {
    slotKey,
    events,
    nextPageKey,
  });
}

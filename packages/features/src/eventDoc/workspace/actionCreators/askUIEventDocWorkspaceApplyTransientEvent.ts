import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceApplyTransientEventEffect } from '../effects/EventDocWorkspaceApplyTransientEventEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Commits a transient event into a slot under transientKey. */
export function* askUIEventDocWorkspaceApplyTransientEvent(slotKey: string, transientKey: string, event: EventDocEvent): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceApplyTransientEventEffect>(EventDocWorkspaceEffect.ApplyTransientEvent, {
    slotKey,
    transientKey,
    event,
  });
}

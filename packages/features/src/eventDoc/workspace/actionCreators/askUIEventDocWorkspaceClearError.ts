import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceClearErrorEffect } from '../effects/EventDocWorkspaceClearErrorEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Clears a slot's error. */
export function* askUIEventDocWorkspaceClearError(slotKey: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceClearErrorEffect>(EventDocWorkspaceEffect.ClearError, { slotKey });
}

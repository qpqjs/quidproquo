import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceClearErrorEffect } from '../effects/EventDocWorkspaceClearErrorEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Clears a slot's error. */
export function* askEventDocWorkspaceClearError(slotKey: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceClearErrorEffect>(EventDocWorkspaceEffect.ClearError, { slotKey });
}

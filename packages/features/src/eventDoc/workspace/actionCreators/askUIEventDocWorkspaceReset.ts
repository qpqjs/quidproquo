import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceResetEffect } from '../effects/EventDocWorkspaceResetEffect';

/** Resets the workspace to its initial state. */
export function* askUIEventDocWorkspaceReset(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceResetEffect>(EventDocWorkspaceEffect.Reset);
}

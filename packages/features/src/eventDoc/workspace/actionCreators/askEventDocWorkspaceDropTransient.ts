import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceDropTransientEffect } from '../effects/EventDocWorkspaceDropTransientEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Drops a transientKey across every slot. */
export function* askEventDocWorkspaceDropTransient(transientKey: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceDropTransientEffect>(EventDocWorkspaceEffect.DropTransient, { transientKey });
}

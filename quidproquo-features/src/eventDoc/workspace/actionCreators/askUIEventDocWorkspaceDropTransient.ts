import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceDropTransientEffect } from '../effects/EventDocWorkspaceDropTransientEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Drops a transientKey across every slot. */
export function* askUIEventDocWorkspaceDropTransient(transientKey: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceDropTransientEffect>(EventDocWorkspaceEffect.DropTransient, { transientKey });
}

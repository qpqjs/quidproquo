import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceCompactEffect } from '../effects/EventDocWorkspaceCompactEffect';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';

/** Moves a slot's base up to its last held event and empties its history; the live view is unchanged. */
export function* askUIEventDocWorkspaceCompact(slotKey: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceCompactEffect>(EventDocWorkspaceEffect.Compact, { slotKey });
}

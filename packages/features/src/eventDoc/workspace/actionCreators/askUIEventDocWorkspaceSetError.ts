import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetErrorEffect } from '../effects/EventDocWorkspaceSetErrorEffect';
import { EventDocWorkspaceSlotError } from '../types/EventDocWorkspaceSlotError';

/** Sets a slot's error. */
export function* askUIEventDocWorkspaceSetError(slotKey: string, error: EventDocWorkspaceSlotError): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetErrorEffect>(EventDocWorkspaceEffect.SetError, { slotKey, error });
}

import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetErrorEffect } from '../effects/EventDocWorkspaceSetErrorEffect';
import { EventDocWorkspaceSlotError } from '../types/EventDocWorkspaceSlotError';

/** Sets a slot's error. */
export function* askEventDocWorkspaceSetError(slotKey: string, error: EventDocWorkspaceSlotError): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetErrorEffect>(EventDocWorkspaceEffect.SetError, { slotKey, error });
}

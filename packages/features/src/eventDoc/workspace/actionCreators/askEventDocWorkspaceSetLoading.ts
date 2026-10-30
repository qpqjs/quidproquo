import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetLoadingEffect } from '../effects/EventDocWorkspaceSetLoadingEffect';

/** Sets a slot's loading flag. */
export function* askEventDocWorkspaceSetLoading(slotKey: string, isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetLoadingEffect>(EventDocWorkspaceEffect.SetLoading, { slotKey, isLoading });
}

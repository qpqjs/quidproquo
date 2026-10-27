import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetLoadingEffect } from '../effects/EventDocWorkspaceSetLoadingEffect';

/** Sets a slot's loading flag. */
export function* askUIEventDocWorkspaceSetLoading(slotKey: string, isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetLoadingEffect>(EventDocWorkspaceEffect.SetLoading, { slotKey, isLoading });
}

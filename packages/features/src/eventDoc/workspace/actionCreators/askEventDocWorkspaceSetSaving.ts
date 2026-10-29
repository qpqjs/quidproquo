import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetSavingEffect } from '../effects/EventDocWorkspaceSetSavingEffect';

/** Sets a slot's saving flag. */
export function* askEventDocWorkspaceSetSaving(slotKey: string, isSaving: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetSavingEffect>(EventDocWorkspaceEffect.SetSaving, { slotKey, isSaving });
}

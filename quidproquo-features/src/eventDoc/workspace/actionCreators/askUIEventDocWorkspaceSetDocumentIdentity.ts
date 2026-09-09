import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceSetDocumentIdentityEffect } from '../effects/EventDocWorkspaceSetDocumentIdentityEffect';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';

/** Binds a slot to a document. */
export function* askUIEventDocWorkspaceSetDocumentIdentity(slotKey: string, documentIdentity: EventDocWorkspaceDocumentIdentity): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocWorkspaceSetDocumentIdentityEffect>(EventDocWorkspaceEffect.SetDocumentIdentity, {
    slotKey,
    documentIdentity,
  });
}

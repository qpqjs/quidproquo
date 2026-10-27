import { createActionRequester, Nullable } from 'quidproquo-core';

import { EventDocWorkspaceDocumentIdentity } from '../../workspace/types/EventDocWorkspaceDocumentIdentity';
import { EventDocActionType } from './EventDocActionType';

/**
 * Yields the ReadIdentity action; the enclosing slot binding answers with the doc's address (serviceName/basePath/id).
 * Null until the slot initialises and always null for unsaved docs. Fails loudly outside a binding.
 */
export const askEventDocReadIdentity = createActionRequester<Nullable<EventDocWorkspaceDocumentIdentity>>()({
  actionType: EventDocActionType.ReadIdentity,
});

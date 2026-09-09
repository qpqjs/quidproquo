import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocEvent, EventDocEventInput } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { eventDocWorkspaceEventsEndpoint } from './eventDocWorkspaceEventsEndpoint';

/** POSTs one event to the document's log; the backend dedups by clientMessageId, stamps the metadata and returns the stored event. */
export function* askEventDocWorkspaceApiAppendEvent(
  identity: EventDocWorkspaceDocumentIdentity,
  input: EventDocEventInput,
): AskResponse<EventDocEvent> {
  const response = yield* askApiRequest<EventDocEventInput, EventDocEvent>(identity.serviceName, 'POST', eventDocWorkspaceEventsEndpoint(identity), {
    body: input,
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to save event (${response.status})`);
  }

  return response.data;
}

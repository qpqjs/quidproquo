import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocEventBootstrapPage } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { eventDocWorkspaceEventsEndpoint } from './eventDocWorkspaceEventsEndpoint';

/** First page of a document's log with includeBase. Only this page carries the base (null when the server has no usable snapshot). */
export function* askEventDocWorkspaceApiFetchBootstrapPage(identity: EventDocWorkspaceDocumentIdentity): AskResponse<EventDocEventBootstrapPage> {
  const response = yield* askApiRequest<void, EventDocEventBootstrapPage>(identity.serviceName, 'GET', eventDocWorkspaceEventsEndpoint(identity), {
    params: { includeBase: 'true' },
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to load events (${response.status})`);
  }

  return response.data;
}

import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';
import { askApiRequest } from '@qpqjs/webserver';

import { EventDocEventBootstrapPage } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { eventDocWorkspaceEventsEndpoint } from './eventDocWorkspaceEventsEndpoint';

/** First page of a document's log with includeBase. Only this page carries the base (null when the server has no usable snapshot). */
export function* askEventDocWorkspaceApiFetchBootstrapPage(identity: EventDocWorkspaceDocumentIdentity): AskResponse<EventDocEventBootstrapPage> {
  const response = yield* askApiRequest<EventDocEventBootstrapPage, void>(identity.serviceName, 'GET', eventDocWorkspaceEventsEndpoint(identity), {
    params: { includeBase: 'true' },
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to load events (${response.status})`);
  }

  return response.data;
}

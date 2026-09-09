import { AskResponse, askThrowError, ErrorTypeEnum, QpqPagedData } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceEventsPageRequest } from '../types/EventDocWorkspaceTransport';
import { eventDocWorkspaceEventsEndpoint } from './eventDocWorkspaceEventsEndpoint';

/** One page of a document's log. afterEventId is exclusive; newestFirst walks the log backwards for the history panel. */
export function* askEventDocWorkspaceApiFetchEventsPage(
  identity: EventDocWorkspaceDocumentIdentity,
  request?: EventDocWorkspaceEventsPageRequest,
): AskResponse<QpqPagedData<EventDocEvent>> {
  const params: Record<string, string> = {};
  if (request?.limit !== undefined) {
    params.limit = String(request.limit);
  }
  if (request?.nextPageKey !== undefined) {
    params.nextPageKey = request.nextPageKey;
  }
  if (request?.afterEventId !== undefined) {
    params.afterEventId = String(request.afterEventId);
  }
  if (request?.newestFirst) {
    params.newestFirst = 'true';
  }

  const response = yield* askApiRequest<void, QpqPagedData<EventDocEvent>>(
    identity.serviceName,
    'GET',
    eventDocWorkspaceEventsEndpoint(identity),
    Object.keys(params).length > 0 ? { params } : undefined,
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to load events (${response.status})`);
  }

  return response.data;
}

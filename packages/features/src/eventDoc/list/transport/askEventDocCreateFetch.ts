import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocSummary } from '../../models';
import { eventDocListCollectionEndpoint } from './eventDocListCollectionEndpoint';

/** POST {basePath}: creates a doc and returns its summary. */
export function* askEventDocCreateFetch(serviceName: string, basePath: string, name: string, code: string): AskResponse<EventDocSummary> {
  const response = yield* askApiRequest<{ name: string; code: string }, EventDocSummary>(
    serviceName,
    'POST',
    eventDocListCollectionEndpoint(basePath),
    { body: { name, code } },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to create ${basePath} item (${response.status})`);
  }

  return response.data;
}

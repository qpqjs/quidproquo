import { AskResponse, askThrowError, ErrorTypeEnum, Nullable, QpqPagedData } from '@qpqjs/core';
import { askApiRequest } from '@qpqjs/webserver';

import { EventDocSummary } from '../../models';
import { eventDocListCollectionEndpoint } from './eventDocListCollectionEndpoint';

/** GET {basePath}: fetches one page of summaries, newest first. No cursor means the first page. */
export function* askEventDocListFetch(
  serviceName: string,
  basePath: string,
  options?: { limit?: number; nextPageKey?: Nullable<string> },
): AskResponse<QpqPagedData<EventDocSummary>> {
  const params: Record<string, string> = {};

  if (options?.limit !== undefined) {
    params.limit = String(options.limit);
  }

  if (options?.nextPageKey) {
    params.nextPageKey = options.nextPageKey;
  }

  const response = yield* askApiRequest<QpqPagedData<EventDocSummary>, void>(
    serviceName,
    'GET',
    eventDocListCollectionEndpoint(basePath),
    Object.keys(params).length > 0 ? { params } : undefined,
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to list ${basePath} (${response.status})`);
  }

  return response.data;
}

import { AskResponse, askThrowError, ErrorTypeEnum, Nullable, QpqPagedData } from '@qpqjs/core';
import { askApiRequest } from '@qpqjs/webserver';

import { EventDocSummary } from '../../models';
import { EventDocListRow } from '../types/EventDocListRow';
import { eventDocListCollectionEndpoint } from './eventDocListCollectionEndpoint';

/** Options for askEventDocListFetch. */
export type EventDocListFetchOptions = {
  limit?: number;
  nextPageKey?: Nullable<string>;
  // The list view to read. Absent or empty means the summary.
  view?: string;
};

/**
 * GET {basePath}: fetches one page of a collection's list view, newest first. No cursor means the first page, and no
 * view means summaries, which is what the result is typed as unless the caller says otherwise.
 */
export function* askEventDocListFetch<TRow extends EventDocListRow = EventDocSummary>(
  serviceName: string,
  basePath: string,
  options?: EventDocListFetchOptions,
): AskResponse<QpqPagedData<TRow>> {
  const params: Record<string, string> = {};
  if (options?.limit !== undefined) {
    params.limit = String(options.limit);
  }
  if (options?.nextPageKey) {
    params.nextPageKey = options.nextPageKey;
  }
  if (options?.view) {
    params.view = options.view;
  }

  const response = yield* askApiRequest<QpqPagedData<TRow>, void>(
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

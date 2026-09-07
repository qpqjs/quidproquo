import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocRenderOptions, EventDocRenderResult } from '../../models';
import { eventDocRenderEndpoint } from './eventDocRenderEndpoint';

/** GET {basePath}/{id}/render: fetches a document's server-rendered output. `renderMode` and `effectiveAt` go as query params. */
export function* askEventDocRenderFetch(
  serviceName: string,
  basePath: string,
  id: string,
  options?: EventDocRenderOptions,
): AskResponse<EventDocRenderResult> {
  const params: Record<string, string> = {};
  if (options?.renderMode) {
    params.renderMode = options.renderMode;
  }
  if (options?.effectiveAt) {
    params.effectiveAt = options.effectiveAt;
  }

  const response = yield* askApiRequest<void, EventDocRenderResult>(
    serviceName,
    'GET',
    eventDocRenderEndpoint(basePath, id),
    Object.keys(params).length > 0 ? { params } : undefined,
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to render ${basePath}/${id} (${response.status})`);
  }

  return response.data;
}

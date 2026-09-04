import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';
import { askOpenApiGetDocument, HTTPEvent, HTTPEventResponse, OpenApiDocumentOptions, qpqWebServerUtils } from 'quidproquo-webserver';

import { OPEN_API_INFO_GLOBAL } from '../../constants/openApiGlobalNames';

/** GET {basePath}/openapi.json: the OpenAPI document generated from this service's routes. */
export function* document(_event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const info = yield* askConfigGetGlobal<OpenApiDocumentOptions>(OPEN_API_INFO_GLOBAL);

  const openApiDocument = yield* askOpenApiGetDocument(info);

  return qpqWebServerUtils.toJsonEventResponse(openApiDocument);
}

import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, OpenApiDocumentOptions, qpqWebServerUtils } from '@qpqjs/webserver';

import { OPEN_API_INFO_GLOBAL } from '../../constants/openApiGlobalNames';
import { buildOpenApiReferenceHtml } from '../../logic/buildOpenApiReferenceHtml';

/** GET {basePath}: the interactive reference UI, reading the document served next to it. */
export function* reference(_event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const info = yield* askConfigGetGlobal<OpenApiDocumentOptions>(OPEN_API_INFO_GLOBAL);

  return qpqWebServerUtils.toHtmlResponse(buildOpenApiReferenceHtml(info.title ?? 'API Reference'));
}

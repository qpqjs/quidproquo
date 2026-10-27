import { AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from '@qpqjs/webserver';

import { eventDocRouteAction } from '../../constants/eventDocRouteAction';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocGetByIdOrThrow } from '../../logic/askEventDocGetByIdOrThrow';

function* askEventDocStoreGet(id: string): AskResponse<HTTPEventResponse> {
  const model = yield* askEventDocGetByIdOrThrow(id);
  return qpqWebServerUtils.toJsonEventResponse(model);
}

/** GET {basePath}/{id}: one summary (404 if missing). */
export function* get(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreGet(params.id), eventDocRouteAction.get));
}

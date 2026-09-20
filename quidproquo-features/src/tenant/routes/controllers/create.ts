import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../../eventDoc/globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../../eventDoc/globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveActor } from '../../../eventDoc/globals/askEventDocResolveActor';
import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askTenantCreate } from '../../logic/askTenantCreate';

function* askTenantRouteCreate(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const actor = yield* askEventDocResolveActor();

  const { name } = yield* askEventDocParseBody<{ name: string }>(event);

  const summary = yield* askTenantCreate(name, actor);
  return qpqWebServerUtils.toJsonEventResponse(summary);
}

/** POST {basePath}: create a tenant (body `{ name }`) under its own scope; the caller becomes its first admin. */
export function* create(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askTenantRouteCreate(event)));
}

import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveActor } from '../../globals/askEventDocResolveActor';
import { askEventDocCreate } from '../../logic/askEventDocCreate';
import { askEventDocParseBody } from '../askEventDocParseBody';

function* askEventDocStoreCreate(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const actor = yield* askEventDocResolveActor();

  const { name, code } = yield* askEventDocParseBody<{
    name: string;
    code: string;
  }>(event);

  const model = yield* askEventDocCreate(name, code, actor);
  return qpqWebServerUtils.toJsonEventResponse(model);
}

/** POST {basePath}: creates a doc (body `{ name, code }`). */
export function* create(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreCreate(event)));
}

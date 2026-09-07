import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveActor } from '../../globals/askEventDocResolveActor';
import { askEventDocEventAppend } from '../../logic/askEventDocEventAppend';
import { EventDocEventInput } from '../../models';
import { askEventDocParseBody } from '../askEventDocParseBody';

function* askEventDocStoreAppendEvent(event: HTTPEvent, modelId: string): AskResponse<HTTPEventResponse> {
  const actor = yield* askEventDocResolveActor();

  const input = yield* askEventDocParseBody<EventDocEventInput>(event);

  const stored = yield* askEventDocEventAppend(modelId, input, actor);

  return qpqWebServerUtils.toJsonEventResponse(stored);
}

/** POST {basePath}/{id}/events: appends a client event to the doc's log. */
export function* appendEvent(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreAppendEvent(event, params.id)));
}

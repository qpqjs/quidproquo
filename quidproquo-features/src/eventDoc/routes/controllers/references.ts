import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocReferencesFromState } from '../../logic/askEventDocReferencesFromState';

function* askEventDocStoreReferences(docId: string): AskResponse<HTTPEventResponse> {
  const links = yield* askEventDocReferencesFromState(docId);
  return qpqWebServerUtils.toJsonEventResponse(links);
}

/** GET {basePath}/{id}/references: the docs the current state depends on, one hop out (empty with no functions object). */
export function* references(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreReferences(params.id)));
}

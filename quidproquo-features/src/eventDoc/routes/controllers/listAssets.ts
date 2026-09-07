import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocListAssets } from '../../data/askEventDocListAssets';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';

function* askEventDocStoreListAssets(docId: string): AskResponse<HTTPEventResponse> {
  const assetIds = yield* askEventDocListAssets(docId);
  return qpqWebServerUtils.toJsonEventResponse(assetIds);
}

/** GET {basePath}/{id}/assets: the doc's asset ids (bytes come from getAsset). */
export function* listAssets(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreListAssets(params.id)));
}

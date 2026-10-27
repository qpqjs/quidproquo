import { AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from '@qpqjs/webserver';

import { eventDocRouteAction } from '../../constants/eventDocRouteAction';
import { askEventDocListAssets } from '../../data/askEventDocListAssets';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';

function* askEventDocStoreListAssets(docId: string): AskResponse<HTTPEventResponse> {
  const assetIds = yield* askEventDocListAssets(docId);
  return qpqWebServerUtils.toJsonEventResponse(assetIds);
}

/** GET {basePath}/{id}/assets: the doc's asset ids (bytes come from getAsset). */
export function* listAssets(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(
    askEventDocProvideRequestScope(event, askEventDocStoreListAssets(params.id), eventDocRouteAction.listAssets),
  );
}

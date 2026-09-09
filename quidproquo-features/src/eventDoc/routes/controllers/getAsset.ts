import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocGenerateAssetDownloadUrl } from '../../data/askEventDocGenerateAssetDownloadUrl';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';

function* askEventDocStoreGetAsset(docId: string, assetId: string): AskResponse<HTTPEventResponse> {
  const result = yield* askEventDocGenerateAssetDownloadUrl(docId, assetId);

  return qpqWebServerUtils.toJsonEventResponse(result);
}

/** GET {basePath}/{id}/assets/{assetId}: a presigned URL to read an asset blob. */
export function* getAsset(event: HTTPEvent, params: { id: string; assetId: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreGetAsset(params.id, params.assetId)));
}

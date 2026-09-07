import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocGenerateAssetUploadUrl } from '../../data/askEventDocGenerateAssetUploadUrl';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocParseBody } from '../askEventDocParseBody';

function* askEventDocStoreCreateAsset(event: HTTPEvent, docId: string): AskResponse<HTTPEventResponse> {
  const { contentType } = yield* askEventDocParseBody<{ contentType: string }>(event);

  const result = yield* askEventDocGenerateAssetUploadUrl(docId, contentType);

  return qpqWebServerUtils.toJsonEventResponse(result);
}

/** POST {basePath}/{id}/assets: a presigned URL to upload an immutable asset blob. */
export function* createAsset(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreCreateAsset(event, params.id)));
}

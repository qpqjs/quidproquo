import { askFileGenerateTemporaryUploadSecureUrl, askNewGuid, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocAssetUploadUrl } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocAssetPath } from './eventDocAssetPath';

const ASSET_UPLOAD_TTL_MS = 5 * 60 * 1000;

/**
 * Mints an assetId and a presigned PUT url for it. A contentDisposition is baked into the signature, so the client must
 * PUT the matching header.
 */
export function* askEventDocGenerateAssetUploadUrl(
  docId: string,
  contentType: string,
  contentDisposition?: string,
): AskResponse<EventDocAssetUploadUrl> {
  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const assetId = yield* askNewGuid();

  const uploadUrl = yield* askFileGenerateTemporaryUploadSecureUrl(
    storageDriveName,
    eventDocAssetPath(docId, assetId),
    ASSET_UPLOAD_TTL_MS,
    { contentType, contentDisposition },
    scope,
  );

  return { uploadUrl, assetId };
}

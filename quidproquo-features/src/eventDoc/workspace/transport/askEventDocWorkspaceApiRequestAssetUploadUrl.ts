import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocAssetUploadUrl } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { eventDocWorkspaceAssetsEndpoint } from './eventDocWorkspaceAssetsEndpoint';

type AssetUploadUrlRequest = { contentType: string };

/**
 * Requests a presigned PUT url and the assetId that will name the blob; the caller uploads, then records the assetId via
 * a domain event.
 */
export function* askEventDocWorkspaceApiRequestAssetUploadUrl(
  identity: EventDocWorkspaceDocumentIdentity,
  contentType: string,
): AskResponse<EventDocAssetUploadUrl> {
  const response = yield* askApiRequest<AssetUploadUrlRequest, EventDocAssetUploadUrl>(
    identity.serviceName,
    'POST',
    eventDocWorkspaceAssetsEndpoint(identity),
    { body: { contentType } },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to request asset upload url (${response.status})`);
  }

  return response.data;
}

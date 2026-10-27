import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { EventDocAssetDownloadUrl } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { eventDocWorkspaceAssetDownloadEndpoint } from './eventDocWorkspaceAssetDownloadEndpoint';

/** Requests a short-lived presigned url to read an asset blob. */
export function* askEventDocWorkspaceApiRequestAssetDownloadUrl(
  identity: EventDocWorkspaceDocumentIdentity,
  assetId: string,
): AskResponse<EventDocAssetDownloadUrl> {
  const response = yield* askApiRequest<void, EventDocAssetDownloadUrl>(
    identity.serviceName,
    'GET',
    eventDocWorkspaceAssetDownloadEndpoint(identity, assetId),
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to request asset download url (${response.status})`);
  }

  return response.data;
}

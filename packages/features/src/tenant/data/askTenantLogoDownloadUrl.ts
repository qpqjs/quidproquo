import { askFileGenerateTemporarySecureUrl, AskResponse } from 'quidproquo-core';

import { eventDocStorageDriveName } from '../../eventDoc/constants/eventDocStorageDriveName';
import { eventDocAssetPath } from '../../eventDoc/data/eventDocAssetPath';
import { EventDocAssetDownloadUrl } from '../../eventDoc/models';
import { TENANT_EVENTDOC_STORE } from '../constants/tenantStoreNames';
import { TenantId } from '../models/TenantId';

const LOGO_DOWNLOAD_TTL_MS = 15 * 60 * 1000;

/**
 * Presign a short-lived read URL for a tenant logo blob in the tenant collection's drive under
 * the given scope (the tenant's own), never the reader's ambient scope.
 */
export function* askTenantLogoDownloadUrl(tenantId: TenantId, assetId: string, scope: string): AskResponse<EventDocAssetDownloadUrl> {
  const url = yield* askFileGenerateTemporarySecureUrl(
    eventDocStorageDriveName(TENANT_EVENTDOC_STORE),
    eventDocAssetPath(tenantId, assetId),
    LOGO_DOWNLOAD_TTL_MS,
    scope,
  );

  return { url };
}

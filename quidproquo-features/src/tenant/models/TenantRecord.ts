import { QpqIsoDateTime } from 'quidproquo-core';

import { EventDocAssetRef } from '../../eventDoc/models';
import { TenantBrandColors } from './TenantBrandColors';
import { TenantStatus } from './TenantStatus';

// The materialized tenant row (pk = tenantId) - the fast path for membership
// checks and branding lookups. Derived from the tenant eventDoc on publish;
// never written directly by request handlers. The logo is stored as an asset
// ref; callers resolve it to a presigned URL at read time.
export type TenantRecord = {
  tenantId: string;
  name: string;
  brandColors?: TenantBrandColors;
  logo?: EventDocAssetRef;
  // Header text shown beside the logo (see TenantDocument.displayName).
  displayName?: string;
  // The storage scope the tenant DOC (and so its asset blobs) live under — the
  // publishing request's ambient scope. The doc is an ordinary scoped doc, so a
  // cross-scope read (serving the logo to a member browsing under TENANT#<id>)
  // must presign the blob in ITS partition, not the reader's. Absent on records
  // published before this field existed (fall back to the creator's personal scope).
  scope?: string;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;
  createdByUserId: string;
  status: TenantStatus;
};

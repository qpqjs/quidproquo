import { QpqIsoDateTime } from 'quidproquo-core';

import { EventDocAssetRef } from '../../eventDoc/models';
import { TenantBrandColors } from './TenantBrandColors';
import { TenantStatus } from './TenantStatus';

/**
 * The materialized tenant row (pk = tenantId): the fast path for record and branding reads.
 * Derived from the tenant eventDoc on publish; never written directly by request handlers.
 * The logo is an asset ref in the tenant's own scope; callers presign it at read time.
 */
export type TenantRecord = {
  tenantId: string;
  name: string;
  brandColors?: TenantBrandColors;
  logo?: EventDocAssetRef;
  // Header text shown beside the logo (see TenantDocument.displayName).
  displayName?: string;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;
  createdByUserId: string;
  status: TenantStatus;
};

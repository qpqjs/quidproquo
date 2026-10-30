import { validateScopeSegment } from '@qpqjs/core';

import { TenantId } from '../../models/TenantId';
import { TENANT_SCOPE_PREFIX } from './storageScopePrefixes';

// The raw id is validated (not the composed value): the prefix characters are
// safe by construction, and the core scope gates re-validate the full segment
// at every use anyway.
export const composeTenantScope = (tenantId: TenantId): string => {
  validateScopeSegment(tenantId);
  return `${TENANT_SCOPE_PREFIX}${tenantId}`;
};

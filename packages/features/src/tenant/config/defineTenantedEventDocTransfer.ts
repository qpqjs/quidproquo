import { QPQConfig } from 'quidproquo-core';

import { defineEventDocTransfer, EventDocTransferOptions } from '../../eventDocTransfer';
import { TENANT_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';

export type TenantedEventDocTransferOptions = Omit<EventDocTransferOptions, 'scopeResolver'>;

// A defineEventDocTransfer with the tenant scope resolver pre-wired, so an export reads and an
// import writes inside the caller's own tenant partition - never unscoped, and never across
// tenants. The pairing matters: transferring collections declared with defineTenantedEventDoc
// through an UNSCOPED transfer would read an empty collection and write into the wrong partition.
// The deploying service must still register the resolver by calling defineTenant.
export const defineTenantedEventDocTransfer = (options: TenantedEventDocTransferOptions): QPQConfig =>
  defineEventDocTransfer({
    ...options,
    scopeResolver: TENANT_SCOPE_RESOLVER_FN,
  });

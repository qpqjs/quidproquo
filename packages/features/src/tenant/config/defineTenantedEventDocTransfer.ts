import { QPQConfig } from '@qpqjs/core';

import { defineEventDocTransfer, EventDocTransferOptions } from '../../eventDocTransfer';
import { TENANT_EVENT_DOC_AUTHORISER_FN, TENANT_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';

export type TenantedEventDocTransferOptions = Omit<EventDocTransferOptions, 'scopeResolver'>;

// A defineEventDocTransfer with the tenant scope resolver pre-wired, so an export reads and an
// import writes inside the caller's own tenant partition - never unscoped, and never across
// tenants. The pairing matters: transferring collections declared with defineTenantedEventDoc
// through an UNSCOPED transfer would read an empty collection and write into the wrong partition.
// Inside a tenant the member must also hold eventDoc:<store>:<action> for every collection the
// transfer reads or rewrites, so the tenant authoriser gates it unless the caller names another.
// The deploying service must still register both functions by calling defineTenant.
export const defineTenantedEventDocTransfer = (options: TenantedEventDocTransferOptions): QPQConfig =>
  defineEventDocTransfer({
    authorise: TENANT_EVENT_DOC_AUTHORISER_FN,
    ...options,
    scopeResolver: TENANT_SCOPE_RESOLVER_FN,
  });

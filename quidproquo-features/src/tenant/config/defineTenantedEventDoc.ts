import { QPQConfig, QpqFunctionRuntime } from 'quidproquo-core';

import { defineEventDoc, EventDocCollectionOptions, EventDocFunctions } from '../../eventDoc';
import { TENANT_EVENT_DOC_AUTHORISER_FN, TENANT_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';

export type TenantedEventDocCollectionOptions = Omit<EventDocCollectionOptions, 'scopeResolver' | 'authorise'>;

// A defineEventDoc with the tenant scope resolver and authoriser pre-wired: the
// collection's stores and assets partition per tenant (header -> membership check ->
// TENANT# scope) or per user (no header -> PERSONAL# scope), never unscoped, and
// inside a tenant every route requires eventDoc:<store>:<action>. The deploying
// service must still register both by calling defineTenant. Use plain
// defineEventDoc for collections that never partition.
export const defineTenantedEventDoc = (
  functions: EventDocFunctions,
  runtime: QpqFunctionRuntime,
  options: TenantedEventDocCollectionOptions,
): QPQConfig =>
  defineEventDoc(functions, runtime, {
    ...options,
    scopeResolver: TENANT_SCOPE_RESOLVER_FN,
    authorise: TENANT_EVENT_DOC_AUTHORISER_FN,
  });

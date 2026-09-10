import { defineKeyValueStore, QPQConfig } from 'quidproquo-core';

import { defineEventDocSummary } from '../../eventDoc/config/defineEventDocSummary';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { TENANT_DOC_TYPE, TENANT_EVENTDOC_STORE, TENANT_MEMBER_LINKS_STORE, TENANT_RECORD_STORE } from '../constants/tenantStoreNames';
import { TenantMemberLinks } from '../models/TenantMemberLinks';
import { TenantRecord } from '../models/TenantRecord';

// The owner-only tenant stores: the eventDoc collection (summary + event log +
// asset drive), the materialized record store, and the tenant -> users reverse
// membership index (the member list's read path). The user -> tenants links table
// is declared separately by defineTenant (every service refs it via its owner).
// snapshotFunctions points the stream projector at the registry definition
// defineTenant registers, so tenant docs get per-view snapshots like any other
// collection.
export const defineTenantStores = (): QPQConfig => [
  defineEventDocSummary(TENANT_EVENTDOC_STORE, {
    snapshotFunctions: { [TENANT_DOC_TYPE]: eventDocFunctionsName(TENANT_EVENTDOC_STORE, TENANT_DOC_TYPE) },
  }),
  defineKeyValueStore<TenantRecord>(TENANT_RECORD_STORE, 'tenantId'),
  defineKeyValueStore<TenantMemberLinks>(TENANT_MEMBER_LINKS_STORE, 'tenantId'),
];

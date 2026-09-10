import { defineKeyValueStore, QPQConfig } from 'quidproquo-core';

import { defineEventDocSummary } from '../../eventDoc/config/defineEventDocSummary';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { TENANT_DOC_TYPE, TENANT_EVENTDOC_STORE, TENANT_RECORD_STORE } from '../constants/tenantStoreNames';
import { TenantRecord } from '../models/TenantRecord';

// The owner-only tenant stores: the eventDoc collection (summary + event log +
// asset drive) and the materialized record store. The membership table is declared
// separately by defineTenant (every service refs it via its owner).
// snapshotFunctions points the stream projector at the registry definition
// defineTenant registers, so tenant docs get per-view snapshots like any other
// collection.
export const defineTenantStores = (): QPQConfig => [
  defineEventDocSummary(TENANT_EVENTDOC_STORE, {
    snapshotFunctions: { [TENANT_DOC_TYPE]: eventDocFunctionsName(TENANT_EVENTDOC_STORE, TENANT_DOC_TYPE) },
  }),
  defineKeyValueStore<TenantRecord>(TENANT_RECORD_STORE, 'tenantId'),
];

import { askMapParallel, AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocGetById } from '../../eventDoc/data/askEventDocGetById';
import { EventDocSummary } from '../../eventDoc/models';
import { TENANT_DOC_TYPE } from '../constants/tenantStoreNames';
import { askTenantMembershipsForUser } from '../data/askTenantMembershipsForUser';
import { askTenantRecordGet } from '../data/askTenantRecordGet';
import { TenantRecord } from '../models/TenantRecord';
import { TenantStatus } from '../models/TenantStatus';

// A registry record presented in the list's summary shape. `versions` is empty
// (publish history lives on the doc, not the record) and `code` is the
// non-user-facing filler - the list consumers only read identity fields.
const tenantRecordToSummary = (record: TenantRecord): EventDocSummary => ({
  type: TENANT_DOC_TYPE,
  id: record.tenantId,
  code: '',
  name: record.name,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  createdBy: record.createdByUserId,
  updatedBy: record.createdByUserId,
  versions: [],
});

// List-my-tenants: hydrate the user's (enabled) memberships two ways. A tenant doc
// homed in the CALLER'S CURRENT scope reads as its live summary (so a fresh,
// never-published draft appears immediately and can be reopened to finish
// setup); every other membership hydrates from the unscoped registry record,
// which exists once the tenant is published. There is no cross-scope doc read:
// a doc is only visible from the scope that owns it, and the record store is
// the registry surface for everyone else. Requires the tenant eventDoc store
// context + the request scope (the tenant routes provide both).
export function* askTenantListForUser(userId: string): AskResponse<EventDocSummary[]> {
  const memberships = yield* askTenantMembershipsForUser(userId);
  const tenantIds = memberships.filter((membership) => !membership.disabled).map((membership) => membership.tenantId);

  const summaries = yield* askMapParallel(tenantIds, function* askHydrateTenant(tenantId): AskResponse<Nullable<EventDocSummary>> {
    const summary = yield* askEventDocGetById(tenantId);
    if (summary) {
      return summary.deletedAt ? null : summary;
    }

    const record = yield* askTenantRecordGet(tenantId);
    if (!record || record.status === TenantStatus.deleted) {
      return null;
    }

    return tenantRecordToSummary(record);
  });

  return summaries.filter((summary): summary is EventDocSummary => summary !== null);
}

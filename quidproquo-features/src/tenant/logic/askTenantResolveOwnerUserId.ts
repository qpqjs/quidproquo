import { AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocGetById } from '../../eventDoc/data/askEventDocGetById';
import { askTenantRecordGet } from '../data/askTenantRecordGet';

// The tenant's owner: its creator. A published tenant answers from the unscoped
// registry record; a never-published draft has no record yet, so fall back to the
// live summary - which only resolves from the scope the doc is homed in (the
// creator's), exactly the caller a draft can have. Null when neither is visible.
// Requires the tenant eventDoc store context + request scope (the tenant routes provide both).
export function* askTenantResolveOwnerUserId(tenantId: string): AskResponse<Nullable<string>> {
  const record = yield* askTenantRecordGet(tenantId);
  if (record) {
    return record.createdByUserId;
  }

  const summary = yield* askEventDocGetById(tenantId);
  return summary?.createdBy ?? null;
}

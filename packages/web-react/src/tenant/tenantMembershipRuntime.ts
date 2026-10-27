import { createInitialTenantMembershipUiState, sharedTenantMembershipUiApi, tenantMembershipUiReducer } from 'quidproquo-features';

import { createQpqRuntimeDefinition } from '../runtime/createQpqRuntimeDefinition';

/** The caller's standing in the selected tenant. Bind with `useTenantMembership`; load it from the tenant-selection handler. */
export const tenantMembershipRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/web-react/tenantMembership',
  api: sharedTenantMembershipUiApi,
  initialState: createInitialTenantMembershipUiState(),
  reducer: tenantMembershipUiReducer,
});

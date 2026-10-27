import { useQpqRuntime } from '../../runtime/useQpqRuntime';
import { tenantMembershipRuntime } from '../tenantMembershipRuntime';

/** The tenant membership api and state: `[api, state]`. `api.tenantMembershipUiLoad(target, tenantId)` fills it. */
export const useTenantMembership = () => {
  const [api, state] = useQpqRuntime(tenantMembershipRuntime);

  return [api, state] as const;
};

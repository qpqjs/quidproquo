import { Nullable } from 'quidproquo-core';
import { createTenantHasPermissionSelector, QpqPermission } from 'quidproquo-features';

import { useMemo } from 'react';

import { createQpqRuntimeComputed } from '../../runtime/createQpqRuntimeComputed';
import { useQpqRuntimeComputed } from '../../runtime/useQpqRuntimeComputed';
import { tenantMembershipRuntime } from '../tenantMembershipRuntime';

/** Whether the caller holds `permission` (optionally on a resource) in the loaded tenant. False until loaded. Hides controls only; the server still checks. */
export const useTenantHasPermission = (permission: QpqPermission, resourceId: string = '', resourceKind: Nullable<string> = null): boolean => {
  // TODO: revist this, im unsure about this.
  const computed = useMemo(
    () => createQpqRuntimeComputed(tenantMembershipRuntime, createTenantHasPermissionSelector(permission, resourceId, resourceKind)),
    [permission, resourceId, resourceKind],
  );

  return useQpqRuntimeComputed(computed);
};

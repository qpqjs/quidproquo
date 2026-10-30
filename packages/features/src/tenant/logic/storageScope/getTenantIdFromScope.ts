import { Nullable } from '@qpqjs/core';

import { TenantId } from '../../models/TenantId';
import { isTenantId } from '../isTenantId';
import { parseStorageScope } from './parseStorageScope';
import { StorageScopeType } from './StorageScopeType';

// Convenience for the common "is this scope a tenant, and which one" read.
export const getTenantIdFromScope = (scope: string): Nullable<TenantId> => {
  const parsed = parseStorageScope(scope);
  return parsed?.type === StorageScopeType.tenant && isTenantId(parsed.id) ? parsed.id : null;
};

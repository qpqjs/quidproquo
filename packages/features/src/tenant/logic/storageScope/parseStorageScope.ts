import { Nullable } from '@qpqjs/core';

import { ParsedStorageScope } from './ParsedStorageScope';
import { PERSONAL_SCOPE_PREFIX, TENANT_SCOPE_PREFIX } from './storageScopePrefixes';
import { StorageScopeType } from './StorageScopeType';

// Null = not a typed scope (unknown format, or a legacy raw scope).
export const parseStorageScope = (scope: string): Nullable<ParsedStorageScope> => {
  if (scope.startsWith(TENANT_SCOPE_PREFIX) && scope.length > TENANT_SCOPE_PREFIX.length) {
    return { type: StorageScopeType.tenant, id: scope.slice(TENANT_SCOPE_PREFIX.length) };
  }

  if (scope.startsWith(PERSONAL_SCOPE_PREFIX) && scope.length > PERSONAL_SCOPE_PREFIX.length) {
    return { type: StorageScopeType.personal, id: scope.slice(PERSONAL_SCOPE_PREFIX.length) };
  }

  return null;
};

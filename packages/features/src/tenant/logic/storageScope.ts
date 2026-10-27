import { Nullable, validateScopeSegment } from 'quidproquo-core';

import { TenantId } from '../models/TenantId';
import { isTenantId } from './isTenantId';

// Typed storage scopes: every tenant-aware request runs under exactly one of
// these two partitions - a tenant the user belongs to, or the user's own
// personal partition. The type prefix keeps the two namespaces disjoint by
// construction, so code that treats the ambient scope as a tenant identity
// (registry lookups, branding) can discriminate without hitting storage.
//
// The prefix is part of the scope segment itself; the '@@QPQSCOPE@@' kvs
// delimiter is composed downstream by the core scope gates, giving keys like
// 'PERSONAL#<userId>@@QPQSCOPE@@<key>'.

export enum StorageScopeType {
  tenant = 'tenant',
  personal = 'personal',
}

export const TENANT_SCOPE_PREFIX = 'TENANT#';
export const PERSONAL_SCOPE_PREFIX = 'PERSONAL#';

export interface ParsedStorageScope {
  type: StorageScopeType;
  id: string;
}

// The raw id is validated (not the composed value): the prefix characters are
// safe by construction, and the core scope gates re-validate the full segment
// at every use anyway.
export const composeTenantScope = (tenantId: TenantId): string => {
  validateScopeSegment(tenantId);
  return `${TENANT_SCOPE_PREFIX}${tenantId}`;
};

export const composePersonalScope = (userId: string): string => {
  validateScopeSegment(userId);
  return `${PERSONAL_SCOPE_PREFIX}${userId}`;
};

// Null = not a typed scope (unknown format, or a legacy raw scope).
export const parseStorageScope = (scope: string): ParsedStorageScope | null => {
  if (scope.startsWith(TENANT_SCOPE_PREFIX) && scope.length > TENANT_SCOPE_PREFIX.length) {
    return { type: StorageScopeType.tenant, id: scope.slice(TENANT_SCOPE_PREFIX.length) };
  }

  if (scope.startsWith(PERSONAL_SCOPE_PREFIX) && scope.length > PERSONAL_SCOPE_PREFIX.length) {
    return { type: StorageScopeType.personal, id: scope.slice(PERSONAL_SCOPE_PREFIX.length) };
  }

  return null;
};

// Convenience for the common "is this scope a tenant, and which one" read.
export const getTenantIdFromScope = (scope: string): Nullable<TenantId> => {
  const parsed = parseStorageScope(scope);
  return parsed?.type === StorageScopeType.tenant && isTenantId(parsed.id) ? parsed.id : null;
};

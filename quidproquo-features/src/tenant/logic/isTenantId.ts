import { createBrandGuard, validateScopeSegment } from 'quidproquo-core';

import { TenantId } from '../models/TenantId';

// A tenant id becomes a scope segment, so it must be valid as one.
const isValidScopeSegment = (value: string): boolean => {
  try {
    validateScopeSegment(value);
    return true;
  } catch {
    return false;
  }
};

/** True when the string can serve as a tenant id (a valid scope segment). */
export const isTenantId = createBrandGuard<string, TenantId>(isValidScopeSegment);

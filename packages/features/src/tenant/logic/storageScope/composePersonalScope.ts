import { validateScopeSegment } from '@qpqjs/core';

import { PERSONAL_SCOPE_PREFIX } from './storageScopePrefixes';

// The raw id is validated (not the composed value), see composeTenantScope.
export const composePersonalScope = (userId: string): string => {
  validateScopeSegment(userId);
  return `${PERSONAL_SCOPE_PREFIX}${userId}`;
};

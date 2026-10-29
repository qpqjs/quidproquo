import { createContextReader } from '@qpqjs/core';

import { activeTenantContext } from './activeTenantContext';

/** Reads the active tenant's typed storage scope, or null outside a tenant-aware request. */
export const askActiveTenantRead = createContextReader(activeTenantContext);

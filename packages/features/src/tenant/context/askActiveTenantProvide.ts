import { createContextProvider } from '@qpqjs/core';

import { activeTenantContext } from './activeTenantContext';

/** Runs a story with the given typed storage scope as the active tenant. */
export const askActiveTenantProvide = createContextProvider(activeTenantContext, (scope: string) => scope);

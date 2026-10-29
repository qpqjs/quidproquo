import { QPQConfig } from '@qpqjs/core';
import { requireModuleDefault } from '@qpqjs/deploy-aws';

/**
 * `require`s a service's infrastructure module and unwraps its QPQ config
 * (default export or module itself). Relies on the caller running with TS
 * require hooks (rspack config eval / ts-node); throws when the module cannot
 * be loaded, so callers decide whether that is fatal or just a warning.
 */
export const requireQpqConfig = (infraPath: string): QPQConfig => requireModuleDefault<QPQConfig>(infraPath);

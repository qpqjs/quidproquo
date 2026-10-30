import { ResolvedDevServerConfig } from '../types';

/**
 * A complete resolved dev server config for processor tests: a scratch runtime path, a loader that
 * rejects (no test here loads a module) and inert storage settings. `overrides` replaces only the fields a test is about.
 */
export const buildTestDevServerConfig = (overrides: Partial<ResolvedDevServerConfig> = {}): ResolvedDevServerConfig => ({
  serverDomain: 'localhost',
  serverPort: 8080,
  runtimePath: '/tmp/runtime',
  dynamicModuleLoader: () => Promise.reject(new Error('buildTestDevServerConfig loads no modules; override dynamicModuleLoader')),
  qpqConfigs: [],
  fileStorageConfig: {
    storagePath: '/tmp/qpq-storage',
    secureUrlPort: 4000,
    secureUrlPublicPort: 4000,
    secureUrlHost: 'localhost',
    secureUrlSecret: 'secret',
  },
  ...overrides,
});

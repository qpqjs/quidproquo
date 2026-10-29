import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig, ViteUserConfig } from 'vitest/config';

import { findSiblingSourceAliases } from './findSiblingSourceAliases';

/**
 * The vitest config shared by every workspace package: node environment, globals on, worker
 * threads, and each sibling package aliased to its `src` so a test never runs against a stale
 * build. Call it with `import.meta.url` from the package's `vitest.config.ts`; `overrides` is
 * merged on top for the few packages that need jsdom, a forks pool or extra env.
 */
export function defineQpqVitestConfig(configUrl: string, overrides: ViteUserConfig = {}): ViteUserConfig {
  const packageDir = path.dirname(fileURLToPath(configUrl));

  const defaults = defineConfig({
    resolve: {
      alias: findSiblingSourceAliases(packageDir),
    },
    test: {
      globals: true,
      environment: 'node',
      pool: 'threads',
    },
  });

  return mergeConfig(defaults, overrides);
}

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against sibling sources, not the last-built libs (see the dev-server config).
    alias: {
      '@qpqjs/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@qpqjs/webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
      '@qpqjs/config-aws': fileURLToPath(new URL('../config-aws/src/index.ts', import.meta.url)),
      '@qpqjs/deploy-aws': fileURLToPath(new URL('../deploy-aws/src/index.ts', import.meta.url)),
    },
  },
});

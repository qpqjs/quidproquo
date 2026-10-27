import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against sibling source, not the last-built lib, like the other packages' configs.
    alias: {
      '@qpqjs/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@qpqjs/config-aws': fileURLToPath(new URL('../config-aws/src/index.ts', import.meta.url)),
      '@qpqjs/webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
      '@qpqjs/deploy-rspack': fileURLToPath(new URL('../deploy-rspack/src/index.ts', import.meta.url)),
      '@qpqjs/user-script': fileURLToPath(new URL('../user-script/src/index.ts', import.meta.url)),
      '@qpqjs/actionprocessor-node': fileURLToPath(new URL('../actionprocessor-node/src/index.ts', import.meta.url)),
    },
  },
});

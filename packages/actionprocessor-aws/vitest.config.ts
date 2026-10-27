import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
  },
  resolve: {
    // Test against core source, not the last-built lib - matches
    // quidproquo-actionprocessor-node's config and keeps class identity
    // (instanceof) consistent across every module in the test process.
    alias: {
      'quidproquo-actionprocessor-js': fileURLToPath(new URL('../actionprocessor-js/src/index.ts', import.meta.url)),
      'quidproquo-core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
      // The tracer is deep-imported as lib/commonjs/traceStoryExecution (so lambda
      // bundles skip the node package's root index); map it to its source too.
      'quidproquo-actionprocessor-node/lib/commonjs/traceStoryExecution': fileURLToPath(
        new URL('../actionprocessor-node/src/traceStoryExecution/index.ts', import.meta.url),
      ),
      'quidproquo-actionprocessor-node': fileURLToPath(new URL('../actionprocessor-node/src/index.ts', import.meta.url)),
    },
  },
});

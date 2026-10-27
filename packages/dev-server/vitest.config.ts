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
    // @qpqjs/actionprocessor-node's config and keeps class identity
    // (instanceof) consistent across every module in the test process.
    alias: {
      '@qpqjs/actionprocessor-js': fileURLToPath(new URL('../actionprocessor-js/src/index.ts', import.meta.url)),
      '@qpqjs/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@qpqjs/webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
      // The tracer is deep-imported as lib/commonjs/traceStoryExecution by the lambda
      // package; map it to its source too.
      '@qpqjs/actionprocessor-node/lib/commonjs/traceStoryExecution': fileURLToPath(
        new URL('../actionprocessor-node/src/traceStoryExecution/index.ts', import.meta.url),
      ),
      '@qpqjs/actionprocessor-node': fileURLToPath(new URL('../actionprocessor-node/src/index.ts', import.meta.url)),
      // The dev server composes the lambda processors beneath its own, so those must
      // resolve to source too, or a processor added to the node package is only seen
      // once the lambda package has been rebuilt.
      '@qpqjs/actionprocessor-aws': fileURLToPath(new URL('../actionprocessor-aws/src/index.ts', import.meta.url)),
      '@qpqjs/config-aws': fileURLToPath(new URL('../config-aws/src/index.ts', import.meta.url)),
    },
  },
});

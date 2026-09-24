import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // aws-cdk-lib's default CloudFormation validator compiles an 8MB wasm module on each worker's
    // first synth (~1s alone, 5s+ with every synth file warming up in parallel), timing out the
    // first test per file. It only reports warnings, so tests lose nothing; real synths still run it.
    env: { CDK_VALIDATION: 'false' },
  },
  resolve: {
    // Test against core source, not the last-built lib - matches
    // quidproquo-dev-server's and quidproquo-actionprocessor-node's configs.
    // Without this the suite silently tests whatever was built last, so a
    // change to a core type that this package renders (schedules, say) passes
    // or fails depending on whether someone remembered to build.
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../quidproquo-core/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../quidproquo-webserver/src/index.ts', import.meta.url)),
      'quidproquo-config-aws': fileURLToPath(new URL('../quidproquo-config-aws/src/index.ts', import.meta.url)),
      'quidproquo-actionprocessor-awslambda': fileURLToPath(new URL('../quidproquo-actionprocessor-awslambda/src/index.ts', import.meta.url)),
      // The tracer is deep-imported as lib/commonjs/traceStoryExecution; map it to source too.
      'quidproquo-actionprocessor-node/lib/commonjs/traceStoryExecution': fileURLToPath(
        new URL('../quidproquo-actionprocessor-node/src/traceStoryExecution/index.ts', import.meta.url),
      ),
      'quidproquo-actionprocessor-node': fileURLToPath(new URL('../quidproquo-actionprocessor-node/src/index.ts', import.meta.url)),
    },
  },
});

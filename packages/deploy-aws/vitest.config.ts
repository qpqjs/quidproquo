import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// aws-cdk-lib's default CloudFormation validator compiles an 8MB wasm module on each worker's first synth,
// timing out the first test per file. It only reports warnings, so tests lose nothing; real synths still run it.
export default defineQpqVitestConfig(import.meta.url, { test: { env: { CDK_VALIDATION: 'false' } } });

import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// rspack's native binding crashes inside a worker thread, so these tests run in forked processes.
// No vi.mock in this package, so test files can share one module cache per worker (T6).
export default defineQpqVitestConfig(import.meta.url, { test: { pool: 'forks', isolate: false } });

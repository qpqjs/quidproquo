import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// rspack's native binding crashes inside a worker thread, so these tests run in forked processes.
export default defineQpqVitestConfig(import.meta.url, { test: { pool: 'forks' } });

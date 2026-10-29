import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// Worker threads cannot host the child processes these tests spawn.
export default defineQpqVitestConfig(import.meta.url, { test: { pool: 'forks' } });

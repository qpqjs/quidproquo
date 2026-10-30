import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// No vi.mock in this package, so test files can share one module cache per worker (T6).
export default defineQpqVitestConfig(import.meta.url, { test: { isolate: false } });

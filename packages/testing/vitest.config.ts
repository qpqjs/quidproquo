// This package owns the helper, so it loads it from source rather than from its own built lib.
import { defineQpqVitestConfig } from './src/vitestConfig';

// No vi.mock in this package, so test files can share one module cache per worker (T6).
export default defineQpqVitestConfig(import.meta.url, { test: { isolate: false } });

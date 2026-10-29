// This package owns the helper, so it loads it from source rather than from its own built lib.
import { defineQpqVitestConfig } from './src/vitestConfig';

export default defineQpqVitestConfig(import.meta.url);

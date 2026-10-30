import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

export default defineQpqVitestConfig(import.meta.url, { test: { environment: 'jsdom' } });

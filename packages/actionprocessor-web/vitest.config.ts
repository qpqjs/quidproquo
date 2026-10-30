import { defineQpqVitestConfig } from '@qpqjs/testing/vitest-config';

// Node 25+ ships an experimental global localStorage that shadows jsdom's; only a forked process can
// take the flag that turns it off, and the root config's execArgv does not reach a project.
export default defineQpqVitestConfig(import.meta.url, {
  test: { pool: 'forks', setupFiles: ['./vitest.setup.ts'], execArgv: ['--no-experimental-webstorage'] },
});

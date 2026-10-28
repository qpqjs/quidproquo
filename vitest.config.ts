import { defineConfig } from 'vitest/config'

import packageJson from './package.json'

const packagesToSkip = [
  'packages/tsconfig'
];

export default defineConfig({
  test: {
    // Most packages set `pool: 'threads'` in their own config: worker threads load test
    // files much faster than forked processes. The ones left on forks need a real process:
    // rspack's native binding crashes inside a worker (deploy-rspack, user-script, cli),
    // actionprocessor-node spawns child processes, and actionprocessor-web needs the
    // Web Storage flag below, which only forks can pass.
    //
    // Node 25+ enables the experimental Web Storage API by default, injecting a
    // global `localStorage` that shadows jsdom's and is non-functional without a
    // `--localstorage-file`. Disable it in every test worker so jsdom owns storage.
    execArgv: ['--no-experimental-webstorage'],
    // Hide console output from passing tests (the library logs on expected error paths),
    // but keep it for failing tests so debugging output is never lost.
    silent: 'passed-only',
    projects: packageJson.workspaces.filter(
      (workspace: string) => !packagesToSkip.includes(workspace)
    ),
    coverage: {
      reportsDirectory: './.coverage',
      reporter: ['text', 'html', 'json'],
      exclude: [
        '**/lib/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/coverage/**',
        '**/.coverage/**',
        '**/scripts/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      include: [
        '**/src/**/*.ts',
        '**/src/**/*.tsx'
      ]
    }
  }
})
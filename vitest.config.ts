import { existsSync } from 'fs';
import { defineConfig } from 'vitest/config'

import packageJson from './package.json'

const packagesToSkip = [
  'quidproquo-tsconfig'
];

// Worker options every project needs. A project referenced by its config file
// inherits nothing from this root config, so each one is wrapped with these.
const sharedProjectTest = {
  // Node 25+ enables the experimental Web Storage API by default, injecting a
  // global `localStorage` that shadows jsdom's and is non-functional without a
  // `--localstorage-file`. Disable it in the test workers so jsdom owns storage.
  execArgv: ['--no-experimental-webstorage'],
};

// Inline projects need their root and name set explicitly; a path-based project
// takes both from its directory, an inline one takes them from this file.
const toProject = (workspace: string) => {
  const configFile = `./${workspace}/vitest.config.ts`;

  if (!existsSync(configFile)) {
    return workspace;
  }

  return { extends: configFile, root: workspace, test: { ...sharedProjectTest, name: workspace } };
};

export default defineConfig({
  test: {
    // Hide console output from passing tests (the library logs on expected error paths),
    // but keep it for failing tests so debugging output is never lost.
    silent: 'passed-only',
    projects: packageJson.workspaces
      .filter((workspace: string) => !packagesToSkip.includes(workspace))
      .map(toProject),
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
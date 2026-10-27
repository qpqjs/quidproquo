// `qpq migrate` — run every pending migration against the LOCAL dev store, once, then exit.
//
// Deployed, migrations are triggered by a stack update. Nothing locally ever deploys, so
// without this a migration is first executed in a real environment, which is a poor place to
// discover what it does. This bundles exactly what `go:dev:api` bundles and runs the same
// queue path, so a local run rehearses the deployed one rather than a convenient lookalike.
//
// Migrations are recorded as they run, in the same store the deploy path uses, so running
// this twice is a no-op the second time.
import { getAppServiceQpqConfigs, getDevServerRspackConfig } from 'quidproquo-deploy-rspack';

import { spawn } from 'child_process';
import path from 'path';
import { rspack } from '@rspack/core';

import { writeDevServerEntry } from '../lib/devServerEntry';
import { getRoot } from '../lib/discovery';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';

const MIGRATE_BUNDLE_PATH = path.join('dist', 'qpq', 'dev-server', 'migrate.js');

export const migrateCommand = async (argv: string[]): Promise<void> => {
  const root = getRoot();
  const appName = await resolveAppSelection({ argv, envVar: 'QPQ_DEV_APP' });
  process.env.QPQ_DEV_APP = appName;
  await resolveDeployment(argv, appName);

  console.log(`Running local migrations for app [${appName}]`);

  const qpqConfigs = getAppServiceQpqConfigs(root, appName);
  const entry = writeDevServerEntry(root, appName, 'migrate');
  const rspackConfig = getDevServerRspackConfig({ root, entry, qpqConfigs });

  // Same bundle shape as the dev server, different output name so a running `go:dev:api`
  // watcher does not fight over the file.
  const bundlePath = path.join(root, MIGRATE_BUNDLE_PATH);
  const migrateConfig = {
    ...rspackConfig,
    output: { ...rspackConfig.output, filename: 'migrate.js' },
  };

  await new Promise<void>((resolve, reject) => {
    rspack(migrateConfig as any, (error, stats) => {
      if (error) {
        return reject(error);
      }

      if (stats?.hasErrors()) {
        console.error(stats.toString({ colors: true, all: false, errors: true }));
        return reject(new Error('Failed to bundle migrations'));
      }

      resolve();
    });
  });

  // The bundle exits non-zero on failure; mirror that so a shell chain or CI notices instead
  // of carrying on as though the data were migrated.
  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn('node', [bundlePath], { stdio: 'inherit', env: { ...process.env, QPQ_DEV_APP: appName } });
    child.on('exit', (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
};

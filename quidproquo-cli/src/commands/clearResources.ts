// `qpq clear-resources` — interactively EMPTY selected data resources (storage
// drive buckets, key value store tables) without touching the stacks: the
// "reset my data" counterpart to `qpq teardown`. Resolves the app +
// deployment the same way as go/teardown, enumerates the app's owned
// resources from its live qpq configs, multi-selects what to empty (with a
// typed confirmation — this deletes stored data), then hands off to the
// platform driver.
import { promptClearResourcesPlan } from '../lib/clearResourcesPlan';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver } from '../platforms';

export const clearResourcesCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);
  const driver = getPlatformDriver(deployment.platform);

  if (!driver.clearResources) {
    console.error(`The '${deployment.platform}' platform has no clear-resources strategy.`);
    process.exit(1);
  }

  const plan = await promptClearResourcesPlan(appName);

  await driver.clearResources(appName, plan);
};

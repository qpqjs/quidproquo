// `qpq teardown` — interactive destroy, the counterpart of `qpq go`. Resolves
// the app + deployment the same way, asks which services to tear down (with
// a typed confirmation — this deletes stored data), then hands off to the
// platform driver to destroy the web, api and inf stacks in that order.
import { promptTeardownPlan } from '../lib/deployPrompts';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver } from '../platforms';

export const teardownCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);
  const driver = getPlatformDriver(deployment.platform);

  if (!driver.teardown) {
    console.error(`The '${deployment.platform}' platform has no teardown strategy.`);
    process.exit(1);
  }

  const plan = await promptTeardownPlan(appName);

  await driver.teardown(appName, plan);
};

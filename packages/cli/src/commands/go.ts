// `qpq go` — interactive deploy. Resolves the app + deployment (whose entry in
// apps/<app>/deploy.config.json names the platform), asks the deploy plan, then
// hands off to the platform driver.
import { buildDeployPlanFromArgs, promptDeployPlan } from '../lib/deployPrompts';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver } from '../platforms';

export const goCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);
  const driver = getPlatformDriver(deployment.platform);

  // Positional args (`qpq go all all`) run prompt-free; otherwise ask.
  const plan = buildDeployPlanFromArgs(appName, argv) ?? (await promptDeployPlan(appName));

  await driver.go(appName, plan);
};

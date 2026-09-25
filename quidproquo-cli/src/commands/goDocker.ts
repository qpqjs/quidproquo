// `qpq go:docker` — asks the same questions as `qpq go`, then runs the
// platform driver's parallel containerized deploy (drivers without a docker
// strategy don't offer one).
import { buildDeployPlanFromArgs, promptDeployPlan } from '../lib/deployPrompts';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver } from '../platforms';

export const goDockerCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);
  const driver = getPlatformDriver(deployment.platform);

  if (!driver.goDocker) {
    console.error(`Platform '${deployment.platform}' has no dockerized deploy — use qpq go instead.`);
    process.exit(1);
  }

  // Positional args (`qpq go:docker all all`) run prompt-free; otherwise ask.
  const plan = buildDeployPlanFromArgs(appName, argv) ?? (await promptDeployPlan(appName));

  await driver.goDocker(appName, plan);
};

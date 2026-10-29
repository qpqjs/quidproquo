// `qpq go:docker`, asks the same questions as `qpq go`, then runs the
// platform driver's parallel containerized deploy (drivers without a docker
// strategy don't offer one). `--build-only` and `--from-build` split that run
// into a build half and a deploy half that can run on different machines.
import { buildDeployPlanFromArgs, promptDeployPlan } from '../lib/deployPrompts';
import { BUILD_ONLY_FLAG, FROM_BUILD_FLAG, resolveGoDockerMode } from '../lib/goDockerMode';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver } from '../platforms';

export const goDockerCommand = async (argv: string[]): Promise<void> => {
  const mode = resolveGoDockerMode(argv);
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);
  const driver = getPlatformDriver(deployment.platform);

  if (!driver.goDocker) {
    console.error(`Platform '${deployment.platform}' has no dockerized deploy — use qpq go instead.`);
    process.exit(1);
  }

  // Positional args (`qpq go:docker all all`) run prompt-free; otherwise ask.
  const plan = buildDeployPlanFromArgs(appName, argv) ?? (await promptDeployPlan(appName));

  // account, domain and bootstrap stacks deploy host-side through the workspace
  // CDK app in one step; there is no saved build to split them across.
  if (mode !== 'full' && (plan.kind === 'account' || plan.kind === 'bootstrap')) {
    console.error(`${BUILD_ONLY_FLAG} and ${FROM_BUILD_FLAG} apply to service deploys only; account, domain and bootstrap deploy in one step.`);
    process.exit(1);
  }

  await driver.goDocker(appName, plan, mode);
};

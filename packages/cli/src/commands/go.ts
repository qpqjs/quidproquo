// `qpq go`, interactive deploy. Resolves the app + deployment (whose entry in
// apps/<app>/deploy.config.json names the platform), asks the deploy plan, then
// hands off to the platform driver.
import { buildDeployPlanFromArgs, promptDeployPlan } from '../lib/deployPrompts';
import { resolveCommandContext } from '../lib/resolveCommandContext';

export const goCommand = async (argv: string[]): Promise<void> => {
  const { appName, driver } = await resolveCommandContext(argv);

  // Positional args (`qpq go all all`) run prompt-free; otherwise ask.
  const plan = buildDeployPlanFromArgs(appName, argv) ?? (await promptDeployPlan(appName));

  await driver.go(appName, plan);
};

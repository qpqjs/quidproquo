// `qpq setup` — takes a cloud environment from empty to deployed, in order, with
// every step checked first so the menu shows what is already in place and a
// rerun on a half-set-up account is safe. The platform (from the environment's
// entry in deploy.config.json) contributes the steps.
//   --check      print each step's status and exit, run nothing
//   --yes        run every step without the menu
//   --only a,b   run only the named step ids (no menu)
import { getArgValue } from '../lib/args';
import { resolveDeployEnvironment } from '../lib/deployEnv';
import { promptCheckbox } from '../lib/prompts';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { SetupCheckResult, SetupStep } from '../lib/setupStep';
import { getPlatformDriver } from '../platforms';

type CheckedStep = { step: SetupStep; result: SetupCheckResult | null };

const statusLabel = (result: SetupCheckResult | null): string => (result === null ? '?' : result.done ? 'done' : 'todo');

const printChecklist = (checked: CheckedStep[]): void => {
  for (const { step, result } of checked) {
    const detail = result?.detail ? `  ${result.detail}` : '';
    console.log(`  [${statusLabel(result).padEnd(4)}] ${step.name}${detail}`);
  }
};

const checkAll = async (steps: SetupStep[]): Promise<CheckedStep[]> => {
  const checked: CheckedStep[] = [];
  for (const step of steps) {
    try {
      checked.push({ step, result: await step.check() });
    } catch (error) {
      checked.push({ step, result: { done: false, detail: `check failed: ${error instanceof Error ? error.message : String(error)}` } });
    }
  }
  return checked;
};

// Steps not yet done are preselected; done ones can still be picked to rerun.
const chooseSteps = async (checked: CheckedStep[]): Promise<SetupStep[]> => {
  const chosen = await promptCheckbox(
    'Setup steps to run (space toggles, enter runs in order)',
    checked.map(({ step, result }) => ({
      name: `[${statusLabel(result).padEnd(4)}] ${step.name}`,
      value: step,
      checked: !result?.done,
      description: result?.detail,
    })),
  );

  // Always run in checklist order, whatever order they were ticked in.
  return checked.map(({ step }) => step).filter((step) => chosen.includes(step));
};

const selectFromArgs = (steps: SetupStep[], argv: string[]): SetupStep[] | null => {
  if (argv.includes('--yes')) {
    return steps;
  }

  const only = getArgValue(argv, '--only');
  if (!only) {
    return null;
  }

  const ids = only.split(',').map((id) => id.trim());
  const unknown = ids.filter((id) => !steps.some((step) => step.id === id));
  if (unknown.length > 0) {
    console.error(`Unknown setup step id(s): ${unknown.join(', ')}. Known: ${steps.map((step) => step.id).join(', ')}`);
    process.exit(1);
  }

  return steps.filter((step) => ids.includes(step.id));
};

export const setupCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { environment, platform } = await resolveDeployEnvironment(argv, appName);
  const driver = getPlatformDriver(platform);

  if (!driver.setupSteps) {
    console.log(`The '${platform}' platform has nothing to set up for environment '${environment}'.`);
    return;
  }

  const steps = await driver.setupSteps(appName, environment);

  console.log(`\nSetup for app '${appName}', environment '${environment}' (${platform})\n`);
  const checked = await checkAll(steps);
  printChecklist(checked);
  console.log('');

  if (argv.includes('--check')) {
    return;
  }

  const toRun = selectFromArgs(steps, argv) ?? (await chooseSteps(checked));
  if (toRun.length === 0) {
    console.log('Nothing selected.');
    return;
  }

  for (const step of toRun) {
    console.log(`\n== ${step.name}\n`);
    await step.run();
  }

  console.log('\nSetup complete. Final state:\n');
  printChecklist(await checkAll(steps));
  console.log(`\nNext: deploy the services with  npx qpq go:docker all all --app ${appName} --env ${environment}`);
};

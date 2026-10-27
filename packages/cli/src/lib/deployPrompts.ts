// The interactive question flow shared by `qpq go` (sequential AWS deploy) and
// a future dockerized variant: pick an app, confirm the target, pick services
// (or domain/bootstrap), pick stacks. buildDeployPlanFromArgs is the
// non-interactive shortcut (`qpq go all all`) that skips every prompt.
import { getPositionalArgs } from './args';
import { getDeployTargetLabel } from './getDeployTargetLabel';
import { getServiceNames } from './discovery';
import { promptSelect, promptText, promptYesNo } from './prompts';

export type StackType = 'all' | 'inf' | 'api' | 'web' | 'views';

const STACK_TYPES: StackType[] = ['all', 'inf', 'api', 'web', 'views'];

export type DeployPlan =
  | { kind: 'cancelled' }
  // Deploy only the account-level guardrails stack (one per AWS account).
  | { kind: 'account'; appName: string }
  // Deploy the bootstrap stack (and optionally the domain stack first).
  | { kind: 'bootstrap'; appName: string; includeDomain: boolean }
  // Deploy the selected stacks for the selected services.
  | {
      kind: 'services';
      appName: string;
      services: string[];
      stacks: StackType;
    };

// Non-interactive deploy plan from positional args: `qpq go <services> [stacks]`.
//   services: 'all' | comma-separated service names | 'account' | 'domain' | 'bootstrap'
//   stacks:   all | inf | api | web | views          (defaults to 'all')
// Returns null when no positional services token is given, so callers fall back
// to the interactive promptDeployPlan. Passing args is an explicit opt-in to a
// prompt-free deploy, so the "Deploying to: [env]" confirmation is skipped too.
export const buildDeployPlanFromArgs = (appName: string, argv: string[]): DeployPlan | null => {
  const [servicesArg, stacksArg] = getPositionalArgs(argv, ['--app', '--deployment']);

  if (!servicesArg) {
    return null;
  }

  if (servicesArg === 'account') {
    return { kind: 'account', appName };
  }
  if (servicesArg === 'domain') {
    return { kind: 'bootstrap', appName, includeDomain: true };
  }
  if (servicesArg === 'bootstrap') {
    return { kind: 'bootstrap', appName, includeDomain: false };
  }

  const allServices = getServiceNames(appName);
  const services = servicesArg === 'all' ? allServices : servicesArg.split(',').map((s) => s.trim()).filter(Boolean);

  const unknownServices = services.filter((service) => !allServices.includes(service));
  if (unknownServices.length > 0) {
    console.error(`Unknown service(s): ${unknownServices.join(', ')}. Valid services: ${allServices.join(', ')}`);
    process.exit(1);
  }

  const stacks = (stacksArg ?? 'all') as StackType;
  if (!STACK_TYPES.includes(stacks)) {
    console.error(`Unknown stacks '${stacksArg}'. Valid stacks: ${STACK_TYPES.join(', ')}`);
    process.exit(1);
  }

  return { kind: 'services', appName, services: [...new Set(services)], stacks };
};

export const promptDeployPlan = async (appName: string): Promise<DeployPlan> => {
  const deployInfo = getDeployTargetLabel();

  if (!(await promptYesNo(`Deploying to: [${deployInfo}]`))) {
    console.log('Exiting!');
    return { kind: 'cancelled' };
  }

  let services: string[] = [];

  do {
    const allServices = getServiceNames(appName);

    // Bracketed so the meta options can't be mistaken for actual services.
    const allText = '[ all ]';
    const accountText = '[ account ]';
    const domainEnvText = '[ domain ]';
    const bootstrapEnvText = '[ bootstrap environment ]';

    const service = await promptSelect('Select services to deploy', [allText, ...allServices, accountText, domainEnvText, bootstrapEnvText]);

    if (service === allText) {
      services = allServices;
      break;
    }
    if (service === accountText) {
      return { kind: 'account', appName };
    }
    if (service === domainEnvText) {
      return { kind: 'bootstrap', appName, includeDomain: true };
    }
    if (service === bootstrapEnvText) {
      return { kind: 'bootstrap', appName, includeDomain: false };
    }

    services.push(service);
  } while (await promptYesNo('Do you want to deploy another service?'));

  services = [...new Set(services)];

  const stacks = (await promptSelect('Stacks to deploy', ['all', 'inf', 'api', 'web', 'views'])) as StackType;

  return { kind: 'services', appName, services, stacks };
};

export type TeardownPlan =
  | { kind: 'cancelled' }
  // Destroy the web, api and inf stacks for the selected services.
  | { kind: 'services'; appName: string; services: string[] };

// The question flow for `qpq teardown`: pick services, then type the deploy
// target back to confirm — destroying inf stacks takes user data (key value
// stores, user directories) with it, so a y/n prompt isn't enough friction.
export const promptTeardownPlan = async (appName: string): Promise<TeardownPlan> => {
  const deployInfo = getDeployTargetLabel();

  let services: string[] = [];

  do {
    const allServices = getServiceNames(appName);
    const allText = '[ all ]';

    const service = await promptSelect('Select services to tear down', [allText, ...allServices]);

    if (service === allText) {
      services = allServices;
      break;
    }

    services.push(service);
  } while (await promptYesNo('Do you want to tear down another service?'));

  services = [...new Set(services)];

  console.log(`\nThis will DESTROY the web, api and inf stacks (including all stored data) for: ${services.join(', ')}`);
  const confirmation = await promptText(`Type '${deployInfo}' to confirm`);

  if (confirmation !== deployInfo) {
    console.log('Confirmation did not match. Exiting!');
    return { kind: 'cancelled' };
  }

  return { kind: 'services', appName, services };
};

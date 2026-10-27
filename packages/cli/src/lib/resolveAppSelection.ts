// One app-selection contract for every app-facing command (prep / synth / go /
// go:dev / go:dev:api / go:dev:web / publish). Resolution order:
//   1. --app <name> / --app=<name> on argv
//   2. npm_config_app                             (npm run x --app foo, no --)
//   3. an env var the command already honours     (QPQ_DEV_APP / DEPLOY_APP_NAME)
//   4. exactly one app under apps/ -> auto-select
//   5. interactive prompt (TTY only)
//   6. otherwise: print the valid app list and exit non-zero
// An unknown name (from any source) also prints the list and exits non-zero.
// Commands that can meaningfully run for every app may pass allowAll to accept
// `--app all` (returned as the literal 'all').
import { getArgValue } from './args';
import { getAvailableApps } from './discovery';
import { promptSelect } from './prompts';

export type ResolveAppOptions = {
  argv: string[];
  // Env var this command historically honours (e.g. QPQ_DEV_APP, DEPLOY_APP_NAME).
  envVar?: string;
  // Accept `--app all` and return 'all'.
  allowAll?: boolean;
};

const exitWithAppList = (requested: string | undefined, availableApps: string[]): never => {
  if (requested) console.error(`Unknown app '${requested}'.`);
  console.error(`Valid apps: ${availableApps.join(', ')}`);
  console.error(`Pass one with --app <name> (e.g. qpq <command> --app ${availableApps[0]}).`);
  process.exit(1);
};

export const resolveAppSelection = async (options: ResolveAppOptions): Promise<string> => {
  const availableApps = getAvailableApps();
  if (availableApps.length === 0) {
    console.error('No apps found under apps/.');
    process.exit(1);
  }

  const requested =
    getArgValue(options.argv, '--app') || process.env.npm_config_app || (options.envVar ? process.env[options.envVar] : undefined);

  if (requested) {
    if (options.allowAll && requested === 'all') return 'all';
    if (!availableApps.includes(requested)) exitWithAppList(requested, availableApps);
    return requested;
  }

  if (availableApps.length === 1) {
    console.log(`Using app: ${availableApps[0]}`);
    return availableApps[0];
  }

  if (process.stdin.isTTY) {
    return promptSelect('Select app', options.allowAll ? [...availableApps, 'all'] : availableApps);
  }

  return exitWithAppList(undefined, availableApps);
};

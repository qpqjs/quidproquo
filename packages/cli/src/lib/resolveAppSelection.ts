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
import { CliError } from './CliError';
import { createOutput } from './out';

const out = createOutput('resolve-app-selection');

export type ResolveAppOptions = {
  argv: string[];
  // Env var this command historically honours (e.g. QPQ_DEV_APP, DEPLOY_APP_NAME).
  envVar?: string;
  // Accept `--app all` and return 'all'.
  allowAll?: boolean;
};

const exitWithAppList = (requested: string | undefined, availableApps: string[]): never => {
  throw new CliError(
    [
      ...(requested ? [`Unknown app '${requested}'.`] : []),
      `Valid apps: ${availableApps.join(', ')}`,
      `Pass one with --app <name> (e.g. qpq <command> --app ${availableApps[0]}).`,
    ].join('\n'),
  );
};

// The app a caller named, from the sources above the auto-select and the prompt (--app, the npm
// config flag, the command's env var); undefined when none did.
export const getRequestedAppName = (argv: string[], envVar?: string): string | undefined =>
  getArgValue(argv, '--app') || process.env.npm_config_app || (envVar ? process.env[envVar] : undefined);

export const resolveAppSelection = async (options: ResolveAppOptions): Promise<string> => {
  const availableApps = getAvailableApps();
  if (availableApps.length === 0) {
    throw new CliError('No apps found under apps/.');
  }

  const requested = getRequestedAppName(options.argv, options.envVar);

  if (requested) {
    if (options.allowAll && requested === 'all') return 'all';
    if (!availableApps.includes(requested)) exitWithAppList(requested, availableApps);
    return requested;
  }

  const [onlyApp] = availableApps;
  if (availableApps.length === 1 && onlyApp !== undefined) {
    out.log(`Using app: ${onlyApp}`);
    return onlyApp;
  }

  if (process.stdin.isTTY) {
    return promptSelect('Select app', options.allowAll ? [...availableApps, 'all'] : availableApps);
  }

  return exitWithAppList(undefined, availableApps);
};

// `qpq hooks <name>`, run the `qpq:<name>` script (or the plain `<name>`
// script when no qpq:-prefixed one exists) of every app and workspace package
// that defines one, in dependency order with parallel execution.
// Wire the root package.json's lifecycle to it, e.g.
// "postinstall": "qpq hooks postinstall". Use --jobs=1 to force serial runs.
import { getArgValue } from '../lib/args';
import { getDefaultHookJobs } from '../lib/getDefaultHookJobs';
import { runHookForAllPackages } from '../lib/hooks';
import { createOutput } from '../lib/out';
import { assertNoFailures } from '../lib/runTasks';

const out = createOutput('hooks');

const getJobs = (argv: string[]): number => {
  const parsed = Number(getArgValue(argv, '--jobs'));
  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.floor(parsed);
  }
  return getDefaultHookJobs();
};

export const hooksCommand = async (argv: string[]): Promise<void> => {
  const [hook] = argv.filter((a) => !a.startsWith('--'));

  if (!hook) {
    out.error('Usage: qpq hooks <name> [--jobs=N]   (runs qpq:<name>, or plain <name>, in every app/package that defines it)');
    process.exit(1);
  }

  const failures = await runHookForAllPackages(hook, getJobs(argv));
  assertNoFailures(`hooks ${hook}`, failures);
};

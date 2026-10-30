// `qpq teardown`, interactive destroy, the counterpart of `qpq go`. Resolves
// the app + deployment the same way, asks which services to tear down (with
// a typed confirmation, this deletes stored data), then hands off to the
// platform driver to destroy the web, api and inf stacks in that order.
import { promptTeardownPlan } from '../lib/deployPrompts';
import { requireDriverCapability } from '../lib/requireDriverCapability';
import { resolveCommandContext } from '../lib/resolveCommandContext';

export const teardownCommand = async (argv: string[]): Promise<void> => {
  const context = await resolveCommandContext(argv);
  const teardown = requireDriverCapability(context, 'teardown');

  const plan = await promptTeardownPlan(context.appName);

  await teardown(context.appName, plan);
};

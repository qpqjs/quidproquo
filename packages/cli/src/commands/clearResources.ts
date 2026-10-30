// `qpq clear-resources`, interactively EMPTY selected data resources (storage
// drive buckets, key value store tables) without touching the stacks: the
// "reset my data" counterpart to `qpq teardown`. Resolves the app +
// deployment the same way as go/teardown, enumerates the app's owned
// resources from its live qpq configs, multi-selects what to empty (with a
// typed confirmation, this deletes stored data), then hands off to the
// platform driver.
import { promptClearResourcesPlan } from '../lib/clearResourcesPlan';
import { requireDriverCapability } from '../lib/requireDriverCapability';
import { resolveCommandContext } from '../lib/resolveCommandContext';

export const clearResourcesCommand = async (argv: string[]): Promise<void> => {
  const context = await resolveCommandContext(argv);
  const clearResources = requireDriverCapability(context, 'clearResources');

  const plan = await promptClearResourcesPlan(context.appName);

  await clearResources(context.appName, plan);
};

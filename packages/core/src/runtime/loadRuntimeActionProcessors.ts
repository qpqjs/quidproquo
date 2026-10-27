import { QPQConfig } from '../config';
import { ActionProcessorList, ActionProcessorListResolver } from '../types/Action';
import { DynamicModuleLoader } from '../types/DynamicModuleLoader';
import { QpqFunctionRuntime } from '../types/QpqFunctionRuntime';
import { getUniqueKeyFromQpqFunctionRuntime } from '../utils/path/getUniqueKeyFromQpqFunctionRuntime';

// Keyed on the loader instance so cache lifetime follows the host: a lambda keeps
// one loader for the sandbox's life (cache hits across invocations), a dev server
// that rebuilds its loader on hot reload invalidates the cache with it.
const cachedListsByLoader = new WeakMap<DynamicModuleLoader, Map<string, Promise<ActionProcessorList>>>();

// Unlike service-wide custom processor sources (skipped on load failure), a
// runtime-attached override that fails to load throws: silently falling back to
// the default processors would, for example, run a route under the wrong auth.
const loadActionProcessorList = async (
  runtime: QpqFunctionRuntime,
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => {
  const resolver: ActionProcessorListResolver = await dynamicModuleLoader(runtime);

  if (typeof resolver !== 'function') {
    throw new Error(`Expected action processor source to be a function, but got ${typeof resolver}: ${JSON.stringify(runtime)}`);
  }

  const actionProcessorList = await resolver(qpqConfig, dynamicModuleLoader);

  if (typeof actionProcessorList !== 'object' || actionProcessorList === null) {
    throw new Error(`Expected action processor list to be an object, but got ${typeof actionProcessorList}: ${JSON.stringify(runtime)}`);
  }

  if (Object.values(actionProcessorList).some((processor) => typeof processor !== 'function')) {
    throw new Error(`Expected all action processors to be functions: ${JSON.stringify(runtime)}`);
  }

  return actionProcessorList;
};

export const loadRuntimeActionProcessors = async (
  qpqConfig: QPQConfig,
  runtimes: QpqFunctionRuntime[] | undefined,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => {
  const merged: ActionProcessorList = {};

  for (const runtime of runtimes || []) {
    let cachedLists = cachedListsByLoader.get(dynamicModuleLoader);
    if (!cachedLists) {
      cachedLists = new Map();
      cachedListsByLoader.set(dynamicModuleLoader, cachedLists);
    }

    const cacheKey = getUniqueKeyFromQpqFunctionRuntime(runtime);

    let listPromise = cachedLists.get(cacheKey);
    if (!listPromise) {
      listPromise = loadActionProcessorList(runtime, qpqConfig, dynamicModuleLoader);
      cachedLists.set(cacheKey, listPromise);

      // A failure must not stick in the cache, or one bad load 500s forever.
      const evictOnFailure = () => cachedLists?.delete(cacheKey);
      listPromise.catch(evictOnFailure);
    }

    Object.assign(merged, await listPromise);
  }

  return merged;
};

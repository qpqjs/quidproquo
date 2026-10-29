import {
  ActionProcessorList,
  ActionProcessorListResolver,
  DynamicModuleLoader,
  loadActionProcessorList,
  QPQConfig,
  qpqCoreUtils,
  QpqFunctionRuntime,
} from '@qpqjs/core';

function getActionProcessorListLoader(dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) {
  return async function loadModule(qpqFunctionRuntime: QpqFunctionRuntime): Promise<ActionProcessorList> {
    try {
      return await loadActionProcessorList(qpqFunctionRuntime, qpqConfig, dynamicModuleLoader);
    } catch (e) {
      // eslint-disable-next-line no-console -- the resolver runs before any logger exists, and the caller settles every loader.
      console.log(`Unable to dynamically load action processors: [${e}] ${JSON.stringify(qpqFunctionRuntime)}`);

      throw e;
    }
  };
}

const getProcessCustomAction = async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => {
  try {
    const actionProcessorListLoader = getActionProcessorListLoader(dynamicModuleLoader, qpqConfig);
    const getCustomActionProcessors = qpqCoreUtils.getActionProcessorSources(qpqConfig);

    const possibleModuleResults = await Promise.allSettled(getCustomActionProcessors.map(actionProcessorListLoader));

    // Keep the lists that loaded and validated; failures were already logged by the loader.
    const actionProcessorLists: ActionProcessorList[] = possibleModuleResults
      .filter((result): result is PromiseFulfilledResult<ActionProcessorList> => result.status === 'fulfilled')
      .map((result) => result.value);

    return actionProcessorLists.reduce((acc, cur) => ({ ...acc, ...cur }), {});
  } catch (e) {
    // eslint-disable-next-line no-console -- see above; this path should be unreachable.
    console.log(`Unable to dynamically load action processors: [${e}]`);

    return {};
  }
};

/**
 * Loads and merges the user-defined action processor lists declared via
 * defineActionProcessors. A source that fails to load or does not validate is
 * skipped (logged), never fatal. Composition roots spread this LAST so custom
 * processors can override the built-in ones.
 */
export const getCustomActionActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getProcessCustomAction(qpqConfig, dynamicModuleLoader)),
});

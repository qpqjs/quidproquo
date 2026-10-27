import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig, qpqCoreUtils, QpqFunctionRuntime } from 'quidproquo-core';

function getActionProcessorListLoader(dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) {
  return async function loadModule(qpqFunctionRuntime: QpqFunctionRuntime): Promise<ActionProcessorList> {
    try {
      const possibleModule: ActionProcessorListResolver = await dynamicModuleLoader(qpqFunctionRuntime);

      if (typeof possibleModule !== 'function') {
        throw new Error(`Expected module to be a function, but got ${typeof possibleModule}`);
      }

      const apl: ActionProcessorList = await possibleModule(qpqConfig, dynamicModuleLoader);

      if (typeof apl !== 'object') {
        throw new Error(`Expected action processor list to be an object, but got ${typeof apl}`);
      }

      if (Object.values(apl).some((aplv) => typeof aplv !== 'function')) {
        throw new Error('Expected all action processors to be functions');
      }

      return apl;
    } catch (e) {
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
    // This should never get hit, but just in case
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

import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getWebEntryInvalidateCacheActionProcessor } from './getWebEntryInvalidateCacheActionProcessor';

export const getWebEntryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getWebEntryInvalidateCacheActionProcessor(qpqConfig, dynamicModuleLoader)),
});

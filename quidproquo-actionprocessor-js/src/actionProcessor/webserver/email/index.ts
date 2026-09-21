import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getEmailParseActionProcessor } from './getEmailParseActionProcessor';

export * from './parseEmailMessage';

// Platform-neutral: parsing is pure, so every runtime registers this one.
export const getEmailActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEmailParseActionProcessor(qpqConfig, dynamicModuleLoader)),
});

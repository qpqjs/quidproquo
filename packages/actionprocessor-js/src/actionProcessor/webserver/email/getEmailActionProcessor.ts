import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getEmailParseActionProcessor } from './getEmailParseActionProcessor';
import { getEmailReceivingHostsActionProcessor } from './getEmailReceivingHostsActionProcessor';

// Platform-neutral: parsing is pure, so every runtime registers this one.
export const getEmailActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEmailParseActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEmailReceivingHostsActionProcessor(qpqConfig, dynamicModuleLoader)),
});

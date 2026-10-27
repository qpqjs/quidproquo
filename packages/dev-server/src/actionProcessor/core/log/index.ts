import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getLogCreateActionProcessor } from './getLogCreateActionProcessor';
import { getLogDisableEventHistoryActionProcessor } from './getLogDisableEventHistoryActionProcessor';
import { getLogTemplateLiteralActionProcessor } from './getLogTemplateLiteralActionProcessor';

export const getLogActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getLogCreateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogDisableEventHistoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogTemplateLiteralActionProcessor(qpqConfig, dynamicModuleLoader)),
});

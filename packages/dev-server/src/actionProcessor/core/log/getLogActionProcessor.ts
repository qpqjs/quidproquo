import { getLogCreateActionProcessor, getLogDisableEventHistoryActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getLogTemplateLiteralActionProcessor } from './getLogTemplateLiteralActionProcessor';

export const getLogActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getLogCreateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogDisableEventHistoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogTemplateLiteralActionProcessor(qpqConfig, dynamicModuleLoader)),
});

import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getRedactedConsoleLogCreateActionProcessor } from './getRedactedConsoleLogCreateActionProcessor';
import { getRedactedConsoleLogTemplateLiteralActionProcessor } from './getRedactedConsoleLogTemplateLiteralActionProcessor';

/** The entry defineConsoleLogRedaction registers: both askLog console processors, redacting before they print. */
export const getConsoleLogRedactionActionProcessors: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getRedactedConsoleLogCreateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getRedactedConsoleLogTemplateLiteralActionProcessor(qpqConfig, dynamicModuleLoader)),
});

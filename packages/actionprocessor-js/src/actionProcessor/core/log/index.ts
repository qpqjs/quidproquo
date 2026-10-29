import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getLogCreateActionProcessor } from './getLogCreateActionProcessor';
import { getLogDisableEventHistoryActionProcessor } from './getLogDisableEventHistoryActionProcessor';
import { getLogRedactStringActionProcessor } from './getLogRedactStringActionProcessor';
import { getLogTemplateLiteralActionProcessor } from './getLogTemplateLiteralActionProcessor';

export const getLogActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getLogCreateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogDisableEventHistoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogTemplateLiteralActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogRedactStringActionProcessor(qpqConfig, dynamicModuleLoader)),
});

// The dev server reuses these two instead of keeping copies (B6).
export * from './getLogCreateActionProcessor';
export * from './getLogDisableEventHistoryActionProcessor';

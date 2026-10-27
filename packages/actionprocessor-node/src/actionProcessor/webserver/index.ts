import { getWebserverActionProcessor as getJsWebserverActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

// The shared webserver processors (dns, ...) are owned by @qpqjs/actionprocessor-js.
// Node builds on top of js; it currently adds no node-specific webserver processors.
export const getWebserverActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getJsWebserverActionProcessor(qpqConfig, dynamicModuleLoader)),
});

import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getOpenApiGetDocumentActionProcessor } from './getOpenApiGetDocumentActionProcessor';

// Platform-neutral: the document is pure config, so every runtime registers this one
export const getOpenApiActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getOpenApiGetDocumentActionProcessor(qpqConfig, dynamicModuleLoader)),
});

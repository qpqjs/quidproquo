import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getOpenApiGetDocumentActionProcessor } from './getOpenApiGetDocumentActionProcessor';

export const getOpenApiActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getOpenApiGetDocumentActionProcessor(qpqConfig, dynamicModuleLoader)),
});

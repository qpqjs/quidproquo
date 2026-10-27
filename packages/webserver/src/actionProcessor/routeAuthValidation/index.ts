import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getRouteAuthValidationDecodeActionProcessor } from './getRouteAuthValidationDecodeActionProcessor';
import { getRouteAuthValidationResolveContextActionProcessor } from './getRouteAuthValidationResolveContextActionProcessor';

export const getRouteAuthValidationActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getRouteAuthValidationDecodeActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getRouteAuthValidationResolveContextActionProcessor(qpqConfig, dynamicModuleLoader)),
});

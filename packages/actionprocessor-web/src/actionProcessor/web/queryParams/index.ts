import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getQueryParamsGetActionProcessor } from './getQueryParamsGetActionProcessor';
import { getQueryParamsGetAllActionProcessor } from './getQueryParamsGetAllActionProcessor';
import { getQueryParamsSetActionProcessor } from './getQueryParamsSetActionProcessor';

export const getQueryParamsActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getQueryParamsGetActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getQueryParamsGetAllActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getQueryParamsSetActionProcessor(qpqConfig, dynamicModuleLoader)),
});

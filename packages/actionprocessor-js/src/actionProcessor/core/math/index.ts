import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getMathRandomNumberActionProcessor } from './getMathRandomNumberActionProcessor';

export const getMathActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getMathRandomNumberActionProcessor(qpqConfig, dynamicModuleLoader)),
});

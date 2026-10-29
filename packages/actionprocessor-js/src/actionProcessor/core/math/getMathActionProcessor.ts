import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getMathRandomNumberActionProcessor } from './getMathRandomNumberActionProcessor';

export const getMathActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getMathRandomNumberActionProcessor(qpqConfig, dynamicModuleLoader)),
});

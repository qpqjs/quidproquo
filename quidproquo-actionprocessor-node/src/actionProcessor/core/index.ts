import { getCoreActionProcessor as getJsCoreActionProcessor, getPlatformActionProcessor } from 'quidproquo-actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getDynamicFunctionsActionProcessor } from './dynamicFunctions';
import { getInlineFunctionActionProcessor } from './inlineFunction';
import { getStreamActionProcessor } from './stream';

// The shared core processors (config, context, date, error, guid, log,
// math, network, platform, system, customActions) are owned by
// quidproquo-actionprocessor-js. Node builds on top of js and only adds the
// processors that need a Node runtime (stream, inlineFunction, dynamicFunctions).
export * from './dynamicFunctions';
export * from './inlineFunction';
export * from './stream';

export const getCoreActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getJsCoreActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getPlatformActionProcessor('node')(qpqConfig, dynamicModuleLoader)),
  ...(await getStreamActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getInlineFunctionActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getDynamicFunctionsActionProcessor(qpqConfig, dynamicModuleLoader)),
});

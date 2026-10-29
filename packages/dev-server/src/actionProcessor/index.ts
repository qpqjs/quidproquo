import { getAwsActionProcessors } from '@qpqjs/actionprocessor-aws';
import { getCustomActionActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../types';
import { getCoreActionProcessor } from './core';
import { getWebserverActionProcessor } from './webserver';

export * from './core';
export * from './webserver';

export const getDevServerActionProcessors = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  devServerConfig: ResolvedDevServerConfig,
): Promise<ActionProcessorList> => {
  const storyActionProcessor = {
    // Start with all the aws action processors..
    ...(await getAwsActionProcessors(qpqConfig, dynamicModuleLoader)),

    // Override with custom ones (includes Node.js file processors if config is provided)
    ...(await getCoreActionProcessor(qpqConfig, dynamicModuleLoader, devServerConfig)),
    ...(await getWebserverActionProcessor(qpqConfig, dynamicModuleLoader)),

    // Always done last, so they can ovveride the default ones if the user wants.
    ...(await getCustomActionActionProcessor(qpqConfig, dynamicModuleLoader)),
  };

  return storyActionProcessor;
};

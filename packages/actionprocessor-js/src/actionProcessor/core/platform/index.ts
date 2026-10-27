import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getPlatformDelayActionProcessor } from './getPlatformDelayActionProcessor';
import { getPlatformGetNameActionProcessor } from './getPlatformGetNameActionProcessor';

// The platform processors need to know which platform is composing them, so
// unlike the other domains this composer is a factory keyed by the name.
export const getPlatformActionProcessor =
  (platformName: string): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getPlatformDelayActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getPlatformGetNameActionProcessor(platformName)(qpqConfig, dynamicModuleLoader)),
  });

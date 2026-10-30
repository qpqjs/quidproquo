import { getAwsActionProcessors } from '@qpqjs/actionprocessor-aws';
import { getCustomActionActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, composeActionProcessorLayers, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../types';
import { getCoreActionProcessor } from './core';
import { getWebserverActionProcessor } from './webserver';

export const getDevServerActionProcessors = (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  devServerConfig: ResolvedDevServerConfig,
): Promise<ActionProcessorList> =>
  composeActionProcessorLayers(qpqConfig, dynamicModuleLoader, [
    // The aws processors first, then the local overrides (node file storage, sqlite stores, local auth) on top.
    getAwsActionProcessors,
    (config, loader) => getCoreActionProcessor(config, loader, devServerConfig),
    getWebserverActionProcessor(devServerConfig),
    // Always last, so a service's own processors can override the defaults.
    getCustomActionActionProcessor,
  ]);

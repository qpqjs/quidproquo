import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../../types';
import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

export const getConfigActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => {
    return {
      ...(await getConfigGetParameterActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getConfigGetParametersActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getConfigGetSecretActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getConfigSetParameterActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    };
  };

import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../../../types';
import { getEmailSendEmailActionProcessor } from './getEmailSendEmailActionProcessor';
import { getEmailSetDeliveryStatusActionProcessor } from './getEmailSetDeliveryStatusActionProcessor';

export const getEmailActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEmailSendEmailActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getEmailSetDeliveryStatusActionProcessor(qpqConfig, dynamicModuleLoader)),
  });

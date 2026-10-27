import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getEmailSendEmailActionProcessor } from './getEmailSendEmailActionProcessor';
import { getEmailSetDeliveryStatusActionProcessor } from './getEmailSetDeliveryStatusActionProcessor';

export const getEmailActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEmailSendEmailActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEmailSetDeliveryStatusActionProcessor(qpqConfig, dynamicModuleLoader)),
});

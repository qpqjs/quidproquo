import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getStateMachineCreateActionProcessor } from './getStateMachineCreateActionProcessor';
import { getStateMachineGetActionProcessor } from './getStateMachineGetActionProcessor';
import { getStateMachineGetStateActionProcessor } from './getStateMachineGetStateActionProcessor';
import { getStateMachineSendEventActionProcessor } from './getStateMachineSendEventActionProcessor';

export const getStateMachineActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getStateMachineCreateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getStateMachineGetActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getStateMachineGetStateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getStateMachineSendEventActionProcessor(qpqConfig, dynamicModuleLoader)),
});

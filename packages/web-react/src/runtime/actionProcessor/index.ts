import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { Dispatch } from 'react';

import { getStateDispatchActionListResolver } from './getStateDispatchActionProcessor';
import { getStateReadActionListResolver } from './getStateReadActionProcessor';

export const getStateActionProcessor =
  <State>(dispatch: Dispatch<any>, getCurrentState: () => State): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getStateDispatchActionListResolver(dispatch)(qpqConfig, dynamicModuleLoader)),
    ...(await getStateReadActionListResolver(getCurrentState)(qpqConfig, dynamicModuleLoader)),
  });

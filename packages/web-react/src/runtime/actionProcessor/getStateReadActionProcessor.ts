import { ActionProcessorList, ActionProcessorListResolver, actionResult, askStateReadBase, ProcessorFor, StateActionType } from '@qpqjs/core';

const getProcessStateRead =
  <State>(getCurrentState: () => State): ProcessorFor<typeof askStateReadBase> =>
  async () => {
    return actionResult(getCurrentState());
  };

export const getStateReadActionListResolver =
  <State>(getCurrentState: () => State): ActionProcessorListResolver =>
  async (qpqConfig, _dynamicModuleLoader): Promise<ActionProcessorList> => ({
    [StateActionType.Read]: getProcessStateRead(getCurrentState),
  });

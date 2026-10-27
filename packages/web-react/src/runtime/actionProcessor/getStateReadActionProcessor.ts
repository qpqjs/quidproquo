import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  askStateReadBase,
  createActionProcessor,
  ProcessorFor,
  StateActionType,
} from 'quidproquo-core';

const getProcessStateRead =
  <State>(getCurrentState: () => State): ProcessorFor<typeof askStateReadBase> =>
  async () => {
    return actionResult(getCurrentState());
  };

export const getStateReadActionListResolver =
  <State>(getCurrentState: () => State): ActionProcessorListResolver =>
  async (_qpqConfig, _dynamicModuleLoader): Promise<ActionProcessorList> => ({
    [StateActionType.Read]: getProcessStateRead(getCurrentState),
  });

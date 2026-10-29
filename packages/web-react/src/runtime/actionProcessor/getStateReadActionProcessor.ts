import { ActionProcessorListResolver, actionResult, askStateReadBase, createActionProcessor, ProcessorFor } from '@qpqjs/core';

const getProcessStateRead =
  <State>(getCurrentState: () => State): ProcessorFor<typeof askStateReadBase> =>
  async () => {
    return actionResult(getCurrentState());
  };

export const getStateReadActionListResolver = <State>(getCurrentState: () => State): ActionProcessorListResolver =>
  createActionProcessor(askStateReadBase, () => getProcessStateRead(getCurrentState));

import { ActionProcessorList, actionResult, askGetRuntimeRemainingTime, ProcessorFor, SystemActionType } from 'quidproquo-core';

import { Context } from 'aws-lambda';

/**
 * Overrides the js "unlimited" GetRuntimeRemainingTime processor with the real lambda
 * deadline. The context is per invocation, so this is built inside the handler and
 * spread over the shared processor list on every invoke.
 */
export const getLambdaRuntimeRemainingTimeActionProcessor = (context: Context): ActionProcessorList => {
  const processGetRuntimeRemainingTime: ProcessorFor<typeof askGetRuntimeRemainingTime> = async () =>
    actionResult(context.getRemainingTimeInMillis());

  return {
    [SystemActionType.GetRuntimeRemainingTime]: processGetRuntimeRemainingTime,
  };
};

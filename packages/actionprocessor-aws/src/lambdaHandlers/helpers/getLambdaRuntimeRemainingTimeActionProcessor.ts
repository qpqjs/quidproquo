import { ActionProcessorListResolver, actionResult, askGetRuntimeRemainingTime, createActionProcessor, ProcessorFor } from '@qpqjs/core';

import { Context } from 'aws-lambda';

/**
 * Overrides the js "unlimited" GetRuntimeRemainingTime processor with the real lambda
 * deadline. The context is per invocation, so this is built inside the handler and
 * merged over the shared processor list on every invoke.
 */
export const getLambdaRuntimeRemainingTimeActionProcessor = (context: Context): ActionProcessorListResolver => {
  const processGetRuntimeRemainingTime: ProcessorFor<typeof askGetRuntimeRemainingTime> = async () =>
    actionResult(context.getRemainingTimeInMillis());

  return createActionProcessor(askGetRuntimeRemainingTime, () => processGetRuntimeRemainingTime);
};

import { actionResult, askGetRuntimeRemainingTime, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

// Plain JS has no execution deadline. Platforms that do (lambda) spread their own
// processor over this one per invocation.
const getProcessSystemGetRuntimeRemainingTime = (qpqConfig: QPQConfig): ProcessorFor<typeof askGetRuntimeRemainingTime> => {
  return async () => {
    return actionResult(Number.MAX_SAFE_INTEGER);
  };
};

export const getSystemGetRuntimeRemainingTimeActionProcessor = createActionProcessor(
  askGetRuntimeRemainingTime,
  getProcessSystemGetRuntimeRemainingTime,
);

import {
  ActionProcessorResult,
  actionResult,
  actionResultError,
  askBatchBase,
  createActionProcessor,
  EitherActionResult,
  isErroredActionResult,
  processAction,
  ProcessorFor,
  QPQConfig,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

// Unwraps one processed batch item. Actions flagged returnErrors get the Either
// envelope (so callers like askCatch can branch); the rest have already been
// screened for failures, so their raw result is safe to resolve.
const unwrapBatchItem = (batchItemResult: ActionProcessorResult<any>, returnErrors?: boolean): unknown => {
  if (returnErrors) {
    const result: EitherActionResult<any> = isErroredActionResult(batchItemResult)
      ? { success: false, error: resolveActionResultError(batchItemResult) }
      : { success: true, result: resolveActionResult(batchItemResult) };

    return result;
  }

  return resolveActionResult(batchItemResult);
};

const getProcessSystemBatch = (qpqConfig: QPQConfig): ProcessorFor<typeof askBatchBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const batchRes = await Promise.all(
      payload.actions.map((a) => processAction(a, actionProcessors, session, logger, updateSession, dynamicModuleLoader, streamRegistry)),
    );

    // A failure in any action NOT flagged returnErrors fails the whole batch.
    const erroredBatchItem = batchRes.find((br, i) => isErroredActionResult(br) && !payload.actions[i].returnErrors);
    if (erroredBatchItem) {
      const error = resolveActionResultError(erroredBatchItem);
      return actionResultError(error.errorType, error.errorText, error.errorStack);
    }

    return actionResult(batchRes.map((br, i) => unwrapBatchItem(br, payload.actions[i].returnErrors)));
  };
};

export const getSystemBatchActionProcessor = createActionProcessor(askBatchBase, getProcessSystemBatch);

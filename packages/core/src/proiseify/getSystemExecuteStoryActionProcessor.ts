import { askExecuteStoryBase } from '../actions';
import { QPQConfig } from '../config';
import { actionResult, actionResultError, isErroredActionResult, resolveActionResult, resolveActionResultError } from '../logic/actionLogic';
import { processAction } from '../runtime';
import { askRunParallel } from '../stories';
import { ActionProcessor, AskResponse, AskResponseReturnType, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQError, Story } from '../types';

export const getDateNow = () => new Date().toISOString();

// Thrown when an action inside a promisified story fails without returnErrors.
// Carries the structured action error so the ExecuteStory processor can
// surface the original errorType instead of collapsing everything to a
// GenericError string.
export class QpqPromisifyActionError extends Error {
  readonly code = 'qpqPromisifyActionError';

  constructor(readonly actionError: QPQError) {
    super(actionError.errorText);
  }
}

type QpqPromisifyRuntime = Parameters<ActionProcessor<any, any>>;

// Define the base type for getRun
export type QpqResolveAsPromise = <T extends AskResponse<any>>(storyRuntime: T) => Promise<AskResponseReturnType<T>>;

export function qpqPromisify<S extends Story<any, any>>(
  story: S,
  runtimeInfo: QpqPromisifyRuntime,
): (...params: Parameters<S>) => Promise<AskResponseReturnType<ReturnType<S>>> {
  return async (...params: Parameters<S>): Promise<AskResponseReturnType<ReturnType<S>>> => {
    try {
      const reader = story(...params);
      let storyProgress = reader.next();

      while (!storyProgress.done) {
        const action = storyProgress.value;

        const [payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry] = runtimeInfo;
        const actionResult = await processAction(action, actionProcessors, session, logger, updateSession, dynamicModuleLoader, streamRegistry);

        const isSuccess = !isErroredActionResult(actionResult);

        if (action.returnErrors) {
          const result = isSuccess
            ? { success: true, result: resolveActionResult(actionResult) }
            : { success: false, error: resolveActionResultError(actionResult) };

          storyProgress = reader.next(result);
        } else {
          if (!isSuccess) {
            throw new QpqPromisifyActionError(resolveActionResultError(actionResult));
          }

          const result = resolveActionResult(actionResult);
          storyProgress = reader.next(result);
        }
      }

      return storyProgress.value;
    } catch (error) {
      // Real errors (including QpqPromisifyActionError above) propagate as-is
      // so callers keep the original message, type and stack. Only non-Error
      // throws get wrapped.
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(`Error in qpqPromisify: ${error}`);
    }
  };
}

export const getRun =
  (qpqPromisifyRuntime: QpqPromisifyRuntime): QpqResolveAsPromise =>
  async <T extends AskResponse<any>>(storyRuntime: T): Promise<AskResponseReturnType<T>> => {
    const runAny = qpqPromisify(askRunParallel, qpqPromisifyRuntime);
    const [result] = await runAny([storyRuntime]);
    return result;
  };

const getProcessExecuteStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askExecuteStoryBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const story = await dynamicModuleLoader(payload.runtime);
    if (!story) {
      return actionResultError(ErrorTypeEnum.NotFound, `Unable to dynamically load: [${payload.runtime}]`);
    }

    try {
      const qpqPromisifyRuntime: QpqPromisifyRuntime = [
        payload,
        session,
        actionProcessors,
        logger,
        updateSession,
        dynamicModuleLoader,
        streamRegistry,
      ];
      const result = await story(...payload.params, getRun(qpqPromisifyRuntime));

      return actionResult(result);
    } catch (error) {
      // Keep the original error type when a nested action failed, instead of
      // collapsing everything into a GenericError.
      if (error instanceof QpqPromisifyActionError) {
        return actionResultError(error.actionError.errorType, error.actionError.errorText, error.actionError.errorStack);
      }

      return actionResultError(ErrorTypeEnum.GenericError, `${error}`);
    }
  };
};

export const getSystemExecuteStoryActionProcessor = createActionProcessor(askExecuteStoryBase, getProcessExecuteStory);

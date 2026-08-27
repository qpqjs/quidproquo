import { QPQConfig } from '../config';
import { isErroredActionResult, resolveActionResult, resolveActionResultError } from '../logic/actionLogic';
import { createStreamRegistry } from '../logic/stream';
import { getApplicationModuleName } from '../qpqCoreUtils';
import { QpqFunctionRuntime, QpqLogger, StreamRegistry } from '../types';
import { Action, ActionProcessorList } from '../types/Action';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';
import { QpqRuntimeType, Story, StoryResult, StorySession, StorySessionUpdater } from '../types/StorySession';
import { getGlobalsFromQpqFunctionRuntime } from '../utils';
import { mergeRuntimeActionProcessors } from './mergeRuntimeActionProcessors';
import { processAction } from './processAction';

export async function resolveStory<TArgs extends Array<any>>(
  story: Story<TArgs, any>,
  args: TArgs,
  qpqConfig: QPQConfig,
  callerSession: StorySession,
  getActionProcessors: (config: QPQConfig, dynamicModuleLoader: any) => Promise<ActionProcessorList>,
  getTimeNow: () => string,
  logger: QpqLogger,
  runtimeCorrelation: string,
  runtimeType: QpqRuntimeType,
  dynamicModuleLoader: any,
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime,
  initialTags?: string[],
  streamRegistry?: StreamRegistry,
): Promise<StoryResult<any>> {
  // Runtime-attached action processor overrides merge over the base list, last
  // wins. In-process nested executions (EXECUTE_STORY, EXECUTE_IMPLEMENTATION_STORY)
  // inherit the caller's merged list for free: their processors pass it through as
  // this call's getActionProcessors. Transport boundaries build the base list fresh
  // from their own runtime's registration.
  const actionProcessors: ActionProcessorList = await mergeRuntimeActionProcessors(
    qpqConfig,
    qpqFunctionRuntimeInfo,
    await getActionProcessors(qpqConfig, dynamicModuleLoader),
    dynamicModuleLoader,
  );
  const registry = streamRegistry ?? createStreamRegistry();
  const reader = story(...args);

  const runtimeGlobals = getGlobalsFromQpqFunctionRuntime(qpqFunctionRuntimeInfo);

  let storyProgress: IteratorResult<Action<any>, any> | null = null;
  let storySession: StorySession = {
    correlation: runtimeCorrelation,
    depth: callerSession.depth + 1,
    decodedAccessToken: callerSession.decodedAccessToken,
    context: callerSession.context,
    localContext: callerSession.localContext,
    // In-process story executions run WITHIN the caller's function, so they
    // inherit its globals - their own registration wins on collision. This
    // covers inline functions (EXECUTE_STORY) AND implementation stories
    // (EXECUTE_IMPLEMENTATION_STORY: tool executors, drive file resolvers,
    // custom implementations) - both are nested, not transport boundaries, so
    // an AI tool executor can read the queue/route globals (e.g. the eventDoc
    // user-directory global needed to resolve the actor). Transport entries
    // (http/queue/ws) start fresh from their own runtime registration only.
    functionGlobals:
      runtimeType === QpqRuntimeType.EXECUTE_STORY || runtimeType === QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY
        ? {
            ...callerSession.functionGlobals,
            ...runtimeGlobals,
          }
        : runtimeGlobals,
  };

  const updateSession: StorySessionUpdater = (newSession: Partial<StorySession>): void => {
    storySession = { ...storySession, ...newSession };
  };

  const response: StoryResult<any> = {
    input: args,
    session: { ...storySession },
    history: [],
    startedAt: getTimeNow(),
    finishedAt: getTimeNow(),
    tags: initialTags || [],
    moduleName: getApplicationModuleName(qpqConfig),
    correlation: storySession.correlation!,
    fromCorrelation: callerSession.correlation,
    runtimeType: runtimeType,
    logs: [],
    qpqFunctionRuntimeInfo,
  };

  // Enforce maximum depth
  if (storySession.depth > 100) {
    return {
      ...response,
      finishedAt: getTimeNow(),
      error: {
        errorText: `Story depth exceeded [${storySession.depth}]!`,
        errorType: ErrorTypeEnum.GenericError,
      },
    };
  }

  try {
    storyProgress = reader.next();

    while (!storyProgress.done) {
      const action = storyProgress.value;
      const executionTime = getTimeNow();

      const actionResult = await processAction(action, actionProcessors, storySession, logger, updateSession, dynamicModuleLoader, registry);

      const historyEntry = {
        act: action,
        res: actionResult,
        startedAt: executionTime,
        finishedAt: getTimeNow(),
      };

      // console.log(`${action.type}: took ${new Date(historyEntry.finishedAt).getTime() - new Date(historyEntry.startedAt).getTime()}ms`);
      response.history.push(historyEntry);

      if (isErroredActionResult(actionResult) && !action.returnErrors) {
        console.log('Caught Error:', JSON.stringify(resolveActionResultError(actionResult)));
        return {
          ...response,
          finishedAt: getTimeNow(),
          error: resolveActionResultError(actionResult),
        };
      }

      // Feed the result back to the story generator
      if (action.returnErrors) {
        const isSuccess = !isErroredActionResult(actionResult);
        const result = isSuccess
          ? { success: true, result: resolveActionResult(actionResult) }
          : { success: false, error: resolveActionResultError(actionResult) };
        storyProgress = reader.next(result);
      } else {
        storyProgress = reader.next(resolveActionResult(actionResult));
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Uncaught Error: [${JSON.stringify(storyProgress?.value?.type)}] ${err.message}`);
      return {
        ...response,
        finishedAt: getTimeNow(),
        error: {
          errorText: err.message,
          errorType: ErrorTypeEnum.GenericError,
          errorStack: storyProgress?.value?.type,
        },
      };
    }
    return {
      ...response,
      finishedAt: getTimeNow(),
      error: {
        errorText: 'Unknown error has occurred!',
        errorType: ErrorTypeEnum.GenericError,
        errorStack: storyProgress?.value?.type,
      },
    };
  }

  const storyResult = {
    ...response,
    finishedAt: getTimeNow(),
    result: storyProgress.value,
  };

  // console.log(`story took ${new Date(storyResult.finishedAt).getTime() - new Date(storyResult.startedAt).getTime()}ms`);
  return storyResult;
}

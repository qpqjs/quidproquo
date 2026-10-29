import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  actionResultError,
  askTraceStory,
  DynamicModuleLoader,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  QpqFunctionRuntime,
  QpqLogger,
  StorySession,
  StorySessionUpdater,
  SystemActionType,
  SystemTraceStoryActionPayload,
} from '@qpqjs/core';

import { traceStoryExecution } from './traceStoryExecution';
import { OwnCodeMarkersResolver } from './types';

// Shared System::TraceStory processor for node runtimes (lambda and the dev server).
// Loads the recorded story's real code through the runtime's dynamicModuleLoader (which
// federates on lambda), then replays it under the tracer. defaultScriptPatterns lets the
// host add environment-specific scripts to trace (e.g. the lambda federated code cache).
const getProcessTraceStory = (
  qpqConfig: QPQConfig,
  defaultScriptPatterns: string[],
  resolveOwnCodeMarkers?: OwnCodeMarkersResolver,
): ProcessorFor<typeof askTraceStory> => {
  return async (
    payload: SystemTraceStoryActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
  ) => {
    const { storyResult, scriptPatterns, onlyOwnCode } = payload;

    if (!storyResult.qpqFunctionRuntimeInfo) {
      return actionResultError(
        askTraceStory.errorType.BadRequest,
        `Story [${storyResult.correlation}] has no qpqFunctionRuntimeInfo - cannot locate its code to trace`,
      );
    }

    const story = await dynamicModuleLoader(storyResult.qpqFunctionRuntimeInfo);
    if (!story) {
      return actionResultError(askTraceStory.errorType.NotFound, `Unable to dynamically load story for [${storyResult.correlation}]`);
    }

    try {
      const { trace } = await traceStoryExecution(storyResult, story, {
        scriptPatterns: [...defaultScriptPatterns, ...(scriptPatterns || [])],
        onlyOwnCode,
        ownCodeMarkers: resolveOwnCodeMarkers?.(storyResult.qpqFunctionRuntimeInfo, qpqConfig),
      });

      return actionResult(trace);
    } catch (error) {
      return actionResultError(ErrorTypeEnum.GenericError, `Trace failed for [${storyResult.correlation}]: ${(error as Error).message}`);
    }
  };
};

export const getSystemTraceStoryActionProcessor =
  (defaultScriptPatterns: string[] = [], resolveOwnCodeMarkers?: OwnCodeMarkersResolver): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig): Promise<ActionProcessorList> => ({
    [SystemActionType.TraceStory]: getProcessTraceStory(qpqConfig, defaultScriptPatterns, resolveOwnCodeMarkers),
  });

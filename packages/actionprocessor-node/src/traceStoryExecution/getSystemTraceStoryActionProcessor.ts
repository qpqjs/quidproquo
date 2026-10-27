import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  actionResultError,
  askTraceStory,
  createActionProcessor,
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
} from 'quidproquo-core';

import { traceStoryExecution } from './traceStoryExecution';

// Resolves extra own-code markers (see resolveSourceMaps.filterOwnCodeLocations) for the
// story being traced. Opt-in: lambda's federated remotes stay on the plain "not
// node_modules" heuristic that already works for them; hosts whose bundle layout defeats
// that heuristic (the dev server bundles every hosted service plus the whole framework
// into one script) pass a resolver to narrow onlyOwnCode to the traced service.
export type OwnCodeMarkersResolver = (qpqFunctionRuntimeInfo: QpqFunctionRuntime | undefined, qpqConfig: QPQConfig) => string[] | undefined;

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
        ErrorTypeEnum.BadRequest,
        `Story [${storyResult.correlation}] has no qpqFunctionRuntimeInfo - cannot locate its code to trace`,
      );
    }

    const story = await dynamicModuleLoader(storyResult.qpqFunctionRuntimeInfo);
    if (!story) {
      return actionResultError(ErrorTypeEnum.NotFound, `Unable to dynamically load story for [${storyResult.correlation}]`);
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

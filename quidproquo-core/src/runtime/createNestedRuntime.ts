import { QPQConfig } from '../config';
import { getApplicationModuleName } from '../qpqCoreUtils';
import { ActionProcessorList, DynamicModuleLoader, QpqFunctionRuntime, QpqLogger, StreamRegistry } from '../types';
import { QpqRuntimeType, StorySession } from '../types/StorySession';
import { createRuntime } from './createRuntime';

/**
 * Creates a runtime for a story that runs in-process inside the caller's story, in the same service.
 * The child keeps the caller's context, local context, function globals, user and stream registry, and gets
 * its own `module::guid` correlation. Never use it across a service boundary: local context would go with it.
 */
export const createNestedRuntime = (
  qpqConfig: QPQConfig,
  callerSession: StorySession,
  actionProcessors: ActionProcessorList,
  getTimeNow: () => string,
  logger: QpqLogger,
  getNewGuid: () => string,
  runtimeType: QpqRuntimeType.EXECUTE_STORY | QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY,
  dynamicModuleLoader: DynamicModuleLoader,
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime,
  initialTags?: string[],
  streamRegistry?: StreamRegistry,
): ReturnType<typeof createRuntime> =>
  createRuntime(
    qpqConfig,
    {
      // The raw accessToken is deliberately left behind; only the decoded token reaches child stories.
      context: callerSession.context,
      localContext: callerSession.localContext,
      functionGlobals: callerSession.functionGlobals,
      depth: (callerSession.depth || 0) + 1,
      decodedAccessToken: callerSession.decodedAccessToken,
      correlation: callerSession.correlation,
    },
    async () => actionProcessors,
    getTimeNow,
    logger,
    `${getApplicationModuleName(qpqConfig)}::${getNewGuid()}`,
    runtimeType,
    dynamicModuleLoader,
    qpqFunctionRuntimeInfo,
    initialTags,
    streamRegistry,
  );

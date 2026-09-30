import {
  actionResultError,
  askExecuteStoryBase,
  createActionProcessor,
  createNestedRuntime,
  ErrorTypeEnum,
  getUniqueKeyFromQpqFunctionRuntime,
  ProcessorFor,
  QPQConfig,
  QpqRuntimeType,
  storyResultToActionResult,
  StorySession,
} from 'quidproquo-core';

import { randomGuid } from '../../../awsLambdaUtils';
import { getDateNow } from './getDateNow';

const getProcessExecuteStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askExecuteStoryBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const story = await dynamicModuleLoader(payload.runtime);

    if (!story) {
      return actionResultError(ErrorTypeEnum.NotFound, `Unable to dynamically load: [${payload.runtime}]`);
    }

    // A payload session can come off the wire (askProcessEvent passes the incoming message's session).
    // Its functionGlobals belong to the sending function in another service, so only the caller's own are kept.
    const callerSession: StorySession = {
      context: payload.storySession?.context || session.context,
      localContext: payload.storySession?.localContext || session.localContext,
      functionGlobals: session.functionGlobals,
      depth: payload.storySession?.depth || session.depth || 0,
      decodedAccessToken: payload.storySession?.decodedAccessToken || session.decodedAccessToken,
      correlation: payload.storySession?.correlation || session.correlation,
    };

    const resolveStory = createNestedRuntime(
      qpqConfig,
      callerSession,
      actionProcessors,
      getDateNow,
      logger,
      randomGuid,
      QpqRuntimeType.EXECUTE_STORY,
      dynamicModuleLoader,
      payload.runtime,
      [],
      streamRegistry,
    );
    const storyResult = await resolveStory(story, payload.params);

    return storyResultToActionResult(storyResult, getUniqueKeyFromQpqFunctionRuntime(payload.runtime));
  };
};

export const getSystemExecuteStoryActionProcessor = createActionProcessor(askExecuteStoryBase, getProcessExecuteStory);

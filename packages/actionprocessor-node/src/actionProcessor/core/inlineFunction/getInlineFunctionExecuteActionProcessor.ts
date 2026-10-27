import {
  actionResultError,
  askInlineFunctionExecuteBase,
  createActionProcessor,
  createNestedRuntime,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QpqRuntimeType,
  storyResultToActionResult,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

const getDateNow = () => new Date().toISOString();

const getProcessExecute = (qpqConfig: QPQConfig): ProcessorFor<typeof askInlineFunctionExecuteBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const inlineFunctions = qpqCoreUtils.getAllInlineFunctions(qpqConfig);
    const inlineFunction = inlineFunctions.find((f) => f.functionName === payload.functionName);

    if (!inlineFunction) {
      return actionResultError(ErrorTypeEnum.NotFound, `Inline function not found: [${payload.functionName}]`);
    }

    const story = await dynamicModuleLoader(inlineFunction.runtime);

    if (!story) {
      return actionResultError(ErrorTypeEnum.NotFound, `Unable to dynamically load inline function: [${payload.functionName}]`);
    }

    const resolveStory = createNestedRuntime(
      qpqConfig,
      session,
      actionProcessors,
      getDateNow,
      logger,
      randomUUID,
      QpqRuntimeType.EXECUTE_STORY,
      dynamicModuleLoader,
      inlineFunction.runtime,
      [],
      streamRegistry,
    );

    const storyResult = await resolveStory(story, [payload.payload]);

    return storyResultToActionResult(storyResult, payload.functionName);
  };
};

export const getInlineFunctionExecuteActionProcessor = createActionProcessor(askInlineFunctionExecuteBase, getProcessExecute);

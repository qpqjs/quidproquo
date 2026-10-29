import {
  ActionProcessorList,
  actionResult,
  actionResultError,
  askDynamicFunctionExecuteBase,
  createActionProcessor,
  createNestedRuntime,
  DynamicFunctionsExecuteActionPayload,
  DynamicModuleLoader,
  generateUuid,
  getDateNow,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  QpqRuntimeType,
  storyResultToActionResult,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
} from '@qpqjs/core';

import { isStoryIterator } from '../logic/isStoryIterator';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const getProcessExecute = <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askDynamicFunctionExecuteBase> => {
  return async (
    payload: DynamicFunctionsExecuteActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ): Promise<any> => {
    const dynamicFunctions = qpqCoreUtils.getAllDynamicFunctions(qpqConfig);
    const dynamicFunctionsSetting = dynamicFunctions.find((f) => f.dynamicFunctionsName === payload.dynamicFunctionsName);

    if (!dynamicFunctionsSetting) {
      return actionResultError(
        askDynamicFunctionExecuteBase.errorType.DynamicFunctionsNotFound,
        `Dynamic functions not found: [${payload.dynamicFunctionsName}]`,
      );
    }

    const functionsObject = await dynamicModuleLoader(dynamicFunctionsSetting.runtime);

    if (!functionsObject) {
      return actionResultError(
        askDynamicFunctionExecuteBase.errorType.ModuleLoadFailed,
        `Unable to dynamically load dynamic functions: [${payload.dynamicFunctionsName}]`,
      );
    }

    // Own enumerable function properties only - the registered object IS the callable
    // surface, nothing is reachable through its prototype.
    const members = functionsObject as Record<string, unknown>;
    const member = Object.prototype.hasOwnProperty.call(members, payload.functionName) ? members[payload.functionName] : undefined;

    if (typeof member !== 'function') {
      return actionResultError(
        askDynamicFunctionExecuteBase.errorType.FunctionNotFound,
        `Function not found: [${payload.dynamicFunctionsName}.${payload.functionName}]`,
      );
    }

    let invocationResult: unknown;
    try {
      invocationResult = member(...payload.args);
    } catch (error) {
      return actionResultError(
        askDynamicFunctionExecuteBase.errorType.FunctionThrew,
        `[${payload.dynamicFunctionsName}.${payload.functionName}] threw: ${getErrorMessage(error)}`,
      );
    }

    if (isStoryIterator(invocationResult)) {
      const resolveStory = createNestedRuntime(
        qpqConfig,
        session,
        actionProcessors,
        getDateNow,
        logger,
        generateUuid,
        QpqRuntimeType.EXECUTE_STORY,
        dynamicModuleLoader,
        dynamicFunctionsSetting.runtime,
        [],
        streamRegistry,
      );

      // The member was already invoked to discover it is a story; the thunk hands
      // the live iterator to the runtime without invoking it a second time.
      const storyResult = await resolveStory(() => invocationResult, []);

      return storyResultToActionResult<R>(storyResult, `${payload.dynamicFunctionsName}.${payload.functionName}`);
    }

    try {
      return actionResult<R>((await invocationResult) as R);
    } catch (error) {
      return actionResultError(
        askDynamicFunctionExecuteBase.errorType.FunctionThrew,
        `[${payload.dynamicFunctionsName}.${payload.functionName}] threw: ${getErrorMessage(error)}`,
      );
    }
  };
};

export const getDynamicFunctionsExecuteActionProcessor = createActionProcessor(askDynamicFunctionExecuteBase, getProcessExecute);

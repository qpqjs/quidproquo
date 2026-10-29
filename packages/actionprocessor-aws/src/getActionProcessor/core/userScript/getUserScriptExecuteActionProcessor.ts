import {
  ActionProcessorList,
  askUserScriptExecuteBase,
  createActionProcessor,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  QpqLogger,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
  UserScriptExecuteActionPayload,
  UserScriptRunnerRequestKind,
} from '@qpqjs/core';

import { requestUserScriptRunner } from './utils/requestUserScriptRunner';

const getProcessExecute = <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptExecuteBase> => {
  return async (
    payload: UserScriptExecuteActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ): Promise<any> =>
    requestUserScriptRunner<R>({
      qpqConfig,
      source: { drive: payload.drive, filepath: payload.filepath, scope: payload.scope },
      request: { kind: UserScriptRunnerRequestKind.call, functionName: payload.functionName, args: payload.args },
      label: `${payload.drive}:${payload.filepath}#${payload.functionName}`,
      errorType: askUserScriptExecuteBase.errorType,
      session,
      actionProcessors,
      logger,
      dynamicModuleLoader,
      streamRegistry,
    });
};

/** The lambda runtime's execute: hands the call to the service's sandboxed runner function instead of running the script in-process. */
export const getUserScriptExecuteActionProcessor = createActionProcessor(askUserScriptExecuteBase, getProcessExecute);

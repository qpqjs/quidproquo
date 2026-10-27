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

import { ResolvedDevServerConfig } from '../../../types';
import { requestUserScriptChild } from './logic/requestUserScriptChild';

const getProcessExecute =
  (devServerConfig: ResolvedDevServerConfig) =>
  <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptExecuteBase> => {
    return async (
      payload: UserScriptExecuteActionPayload,
      session: StorySession,
      actionProcessors: ActionProcessorList,
      logger: QpqLogger,
      updateSession: StorySessionUpdater,
      dynamicModuleLoader: DynamicModuleLoader,
      streamRegistry: StreamRegistry,
    ): Promise<any> =>
      requestUserScriptChild<R>({
        devServerConfig,
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

/** The dev server's execute: runs the script in a child process with the same limits and errors as the lambda runner. */
export const getUserScriptExecuteActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserScriptExecuteBase, getProcessExecute(devServerConfig));

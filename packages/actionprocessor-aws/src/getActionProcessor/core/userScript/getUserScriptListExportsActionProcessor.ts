import {
  ActionProcessorList,
  askUserScriptListExports,
  createActionProcessor,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  QpqLogger,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
  UserScriptListExportsActionPayload,
  UserScriptModuleExports,
  UserScriptRunnerRequestKind,
} from '@qpqjs/core';

import { requestUserScriptRunner } from './logic/requestUserScriptRunner';

const getProcessListExports = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptListExports> => {
  return async (
    payload: UserScriptListExportsActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ) =>
    requestUserScriptRunner<UserScriptModuleExports>({
      qpqConfig,
      source: payload,
      request: { kind: UserScriptRunnerRequestKind.listExports },
      label: `${payload.drive}:${payload.filepath}`,
      errorType: askUserScriptListExports.errorType,
      session,
      actionProcessors,
      logger,
      dynamicModuleLoader,
      streamRegistry,
    });
};

/** The lambda runtime's list-exports: the runner loads the built file and reports its exports, so the build's check never runs script code here. */
export const getUserScriptListExportsActionProcessor = createActionProcessor(askUserScriptListExports, getProcessListExports);

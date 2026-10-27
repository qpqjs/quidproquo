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

import { ResolvedDevServerConfig } from '../../../types';
import { requestUserScriptChild } from './logic/requestUserScriptChild';

const getProcessListExports =
  (devServerConfig: ResolvedDevServerConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptListExports> => {
    return async (
      payload: UserScriptListExportsActionPayload,
      session: StorySession,
      actionProcessors: ActionProcessorList,
      logger: QpqLogger,
      updateSession: StorySessionUpdater,
      dynamicModuleLoader: DynamicModuleLoader,
      streamRegistry: StreamRegistry,
    ) =>
      requestUserScriptChild<UserScriptModuleExports>({
        devServerConfig,
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

/** The dev server's list-exports: the child loads the built file and reports its exports, so the build's check never runs script code in the server. */
export const getUserScriptListExportsActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserScriptListExports, getProcessListExports(devServerConfig));

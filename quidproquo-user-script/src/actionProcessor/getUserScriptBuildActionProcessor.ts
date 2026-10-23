import {
  ActionProcessorList,
  actionResult,
  actionResultError,
  askFileListDirectory,
  askFileReadTextContents,
  askUserScriptBuild,
  createActionProcessor,
  createNestedRuntime,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  QpqLogger,
  QpqRuntimeType,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
  UserScriptBuildActionPayload,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { UserScriptBuildError } from '../build/UserScriptBuildError';
import { askUserScriptCollectSource } from './logic/askUserScriptCollectSource';
import { askUserScriptPublishOutput } from './logic/askUserScriptPublishOutput';
import { buildUserScriptInTempDir } from './logic/buildUserScriptInTempDir';
import { BuiltUserScript } from './logic/BuiltUserScript';
import { getUserScriptBuildErrorType } from './logic/getUserScriptBuildErrorType';
import { materialiseUserScriptSource } from './logic/materialiseUserScriptSource';

const { errorType } = askUserScriptBuild;

const getDateNow = () => new Date().toISOString();

// Drive failures while collecting the source, re-labelled into this action's catalog; any
// other failure passes through with its own type.
const COLLECT_ERROR_TYPES: Record<string, string> = {
  [askFileListDirectory.errorType.DirectoryNotFound]: errorType.SourceNotFound,
  [askFileListDirectory.errorType.DriveNotFound]: errorType.DriveNotFound,
  [askFileListDirectory.errorType.InvalidScope]: errorType.InvalidScope,
  [askFileReadTextContents.errorType.InvalidScope]: errorType.InvalidScope,
};

const getProcessBuild = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptBuild> => {
  return async (
    payload: UserScriptBuildActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ) => {
    const resolveStory = createNestedRuntime(
      qpqConfig,
      session,
      actionProcessors,
      getDateNow,
      logger,
      randomUUID,
      QpqRuntimeType.EXECUTE_STORY,
      dynamicModuleLoader,
      undefined,
      [],
      streamRegistry,
    );

    // The source and the output both travel through the file actions, so each runtime's
    // own drive implementation serves them; only the build itself touches local disk.
    const collected = await resolveStory(() => askUserScriptCollectSource(payload.drive, payload.sourceDirectory, payload.scope), []);
    if (collected.error) {
      return actionResultError(COLLECT_ERROR_TYPES[collected.error.errorType] ?? collected.error.errorType, collected.error.errorText);
    }

    let built: BuiltUserScript;
    try {
      built = await buildUserScriptInTempDir((projectDir) => materialiseUserScriptSource(projectDir, collected.result), payload.sourceMap);
    } catch (error) {
      if (error instanceof UserScriptBuildError) {
        return actionResultError(getUserScriptBuildErrorType(error.code, errorType), error.message);
      }
      throw error;
    }

    const published = await resolveStory(() => askUserScriptPublishOutput(payload.drive, payload.outputFilepath, built.script, payload.scope), []);
    if (published.error) {
      return actionResultError(published.error.errorType, published.error.errorText);
    }

    return actionResult({ exports: built.exports });
  };
};

export const getUserScriptBuildActionProcessor = createActionProcessor(askUserScriptBuild, getProcessBuild);

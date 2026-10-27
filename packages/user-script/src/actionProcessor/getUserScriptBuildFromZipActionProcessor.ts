import { loadUserScriptHostModules } from '@qpqjs/actionprocessor-node';
import {
  ActionProcessorList,
  actionResult,
  actionResultError,
  askFileReadBinaryContents,
  askUserScriptBuildFromZip,
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
  UserScriptBuildFromZipActionPayload,
} from '@qpqjs/core';

import { randomUUID } from 'crypto';

import { UserScriptBuildError } from '../build/UserScriptBuildError';
import { askUserScriptCheckPublishedOutput } from './logic/askUserScriptCheckPublishedOutput';
import { askUserScriptPublishOutput } from './logic/askUserScriptPublishOutput';
import { buildUserScriptInTempDir } from './logic/buildUserScriptInTempDir';
import { BuiltUserScript } from './logic/BuiltUserScript';
import { extractUserScriptZip } from './logic/extractUserScriptZip';
import { getUserScriptBuildErrorType } from './logic/getUserScriptBuildErrorType';
import { USER_SCRIPT_SOURCE_LIMITS } from './logic/USER_SCRIPT_SOURCE_LIMITS';
import { UserScriptArchiveError } from './logic/UserScriptArchiveError';

const { errorType } = askUserScriptBuildFromZip;

const getDateNow = () => new Date().toISOString();

// Drive failures while reading the zip, re-labelled into this action's catalog; any other
// failure passes through with its own type.
const READ_ERROR_TYPES: Record<string, string> = {
  [askFileReadBinaryContents.errorType.FileNotFound]: errorType.SourceNotFound,
  [askFileReadBinaryContents.errorType.InvalidScope]: errorType.InvalidScope,
};

// The archive error codes are named after the action's own catalog.
const getArchiveErrorType = (error: UserScriptArchiveError): string => errorType[error.code];

const getProcessBuildFromZip = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptBuildFromZip> => {
  return async (
    payload: UserScriptBuildFromZipActionPayload,
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

    const read = await resolveStory(() => askFileReadBinaryContents(payload.drive, payload.zipFilepath, payload.scope), []);
    if (read.error) {
      return actionResultError(READ_ERROR_TYPES[read.error.errorType] ?? read.error.errorType, read.error.errorText);
    }

    // The file actions give no size without the bytes, so the zip's own cap applies to
    // what came back before anything is unpacked.
    const zip = Buffer.from(read.result.base64Data, 'base64');
    if (zip.length > USER_SCRIPT_SOURCE_LIMITS.maxBytes) {
      return actionResultError(
        errorType.SourceTooLarge,
        `[${payload.drive}:${payload.zipFilepath}] is larger than ${USER_SCRIPT_SOURCE_LIMITS.maxBytes} bytes`,
      );
    }

    // The service's own script modules, which the bundler keeps external. One that does not
    // load is the service's fault, so it throws rather than failing the build.
    const hostModules = await loadUserScriptHostModules(qpqConfig, dynamicModuleLoader);

    let built: BuiltUserScript;
    try {
      built = await buildUserScriptInTempDir(
        async (projectDir) => {
          await extractUserScriptZip(zip, projectDir);
        },
        payload.sourceMap,
        hostModules,
      );
    } catch (error) {
      if (error instanceof UserScriptArchiveError) {
        return actionResultError(getArchiveErrorType(error), `[${payload.drive}:${payload.zipFilepath}] ${error.message}`);
      }
      if (error instanceof UserScriptBuildError) {
        return actionResultError(getUserScriptBuildErrorType(error.code, errorType), error.message);
      }
      throw error;
    }

    const published = await resolveStory(() => askUserScriptPublishOutput(payload.drive, payload.outputFilepath, built.script, payload.scope), []);
    if (published.error) {
      return actionResultError(published.error.errorType, published.error.errorText);
    }

    // The output contract is judged where the script's top-level code cannot reach the host.
    const checked = await resolveStory(() => askUserScriptCheckPublishedOutput(payload.drive, payload.outputFilepath, payload.scope, errorType), []);
    if (checked.error) {
      return actionResultError(checked.error.errorType, checked.error.errorText);
    }

    return actionResult({ exports: checked.result });
  };
};

export const getUserScriptBuildFromZipActionProcessor = createActionProcessor(askUserScriptBuildFromZip, getProcessBuildFromZip);

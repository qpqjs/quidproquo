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
import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildUserScript } from '../build/buildUserScript';
import { UserScriptBuildError, UserScriptBuildErrorCode } from '../build/UserScriptBuildError';
import { askUserScriptCollectSource } from './logic/askUserScriptCollectSource';
import { askUserScriptPublishOutput } from './logic/askUserScriptPublishOutput';
import { UserScriptSourceFile } from './logic/UserScriptSourceFile';

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

// The build's own codes map one to one, except that a missing entry is the caller's
// source being wrong, not the build.
const BUILD_ERROR_TYPES: Record<UserScriptBuildErrorCode, string> = {
  [UserScriptBuildErrorCode.NoEntry]: errorType.SourceNotFound,
  [UserScriptBuildErrorCode.BuildFailed]: errorType.BuildFailed,
  [UserScriptBuildErrorCode.OutputNotSingleFile]: errorType.OutputNotSingleFile,
  [UserScriptBuildErrorCode.NoExports]: errorType.NoExports,
  [UserScriptBuildErrorCode.NonFunctionExport]: errorType.NonFunctionExport,
};

// A listing entry is a drive path, never a filesystem path, so a segment that would
// climb out of the project directory is refused rather than written.
const isInsideProject = (relativePath: string): boolean => !relativePath.split('/').some((segment) => segment === '..' || segment === '');

const materialise = (projectDir: string, files: UserScriptSourceFile[]): void => {
  for (const file of files) {
    if (!isInsideProject(file.path)) {
      throw new UserScriptBuildError(UserScriptBuildErrorCode.BuildFailed, `Refusing source path [${file.path}]`);
    }
    const target = path.join(projectDir, ...file.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.text);
  }
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

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-user-script-'));
    const projectDir = path.join(tempDir, 'project');
    const outDir = path.join(tempDir, 'out');

    try {
      let built: { script: string; sourceMap: string; exports: string[] };
      try {
        materialise(projectDir, collected.result);
        const result = await buildUserScript({ projectDir, outDir });
        built = {
          script: fs.readFileSync(result.entryPath, 'utf8'),
          sourceMap: fs.readFileSync(result.sourceMapPath, 'utf8'),
          exports: result.exports,
        };
      } catch (error) {
        if (error instanceof UserScriptBuildError) {
          return actionResultError(BUILD_ERROR_TYPES[error.code], error.message);
        }
        throw error;
      }

      const published = await resolveStory(
        () => askUserScriptPublishOutput(payload.drive, payload.outputDirectory, built.script, built.sourceMap, payload.scope),
        [],
      );
      if (published.error) {
        return actionResultError(published.error.errorType, published.error.errorText);
      }

      return actionResult({ exports: built.exports });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
};

export const getUserScriptBuildActionProcessor = createActionProcessor(askUserScriptBuild, getProcessBuild);

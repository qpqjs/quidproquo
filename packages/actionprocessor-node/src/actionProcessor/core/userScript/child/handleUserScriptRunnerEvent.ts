import {
  ActionProcessorResult,
  actionResult,
  actionResultError,
  askUserScriptExecuteBase,
  askUserScriptListExports,
  createRuntime,
  DynamicModuleLoader,
  isErroredActionResult,
  QPQConfig,
  QpqLogger,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptModuleExports,
  UserScriptRunnerEvent,
  UserScriptRunnerRequestKind,
  UserScriptRunnerResult,
} from '@qpqjs/core';

import { randomUUID } from 'crypto';

import { getUserScriptRunnerActionProcessors } from '../getUserScriptRunnerActionProcessors';
import { getUserScriptModuleMap } from '../logic/getUserScriptModuleMap';
import { listUserScriptExports } from '../logic/listUserScriptExports';
import { loadUserScriptHostModules } from '../logic/loadUserScriptHostModules';
import { runUserScript } from '../logic/runUserScript';
import { UserScriptModuleMap } from '../logic/UserScriptModuleMap';
import { UserScriptModuleNotFoundError } from '../logic/UserScriptModuleNotFoundError';
import { fetchUserScriptSource } from './fetchUserScriptSource';

const { errorType } = askUserScriptExecuteBase;

// The sandbox has nowhere to ship story logs (no permissions), so the runtime logs to nothing.
const silentLogger: QpqLogger = {
  enableLogs: async () => {},
  log: async () => {},
  waitToFinishWriting: async () => {},
  moveToPermanentStorage: async () => {},
};

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// The list request's failures in its own action's catalog.
const listExports = (filename: string, source: string, modules: UserScriptModuleMap): ActionProcessorResult<UserScriptModuleExports> => {
  try {
    return actionResult(listUserScriptExports(filename, source, modules));
  } catch (error) {
    if (error instanceof UserScriptModuleNotFoundError) {
      return actionResultError(askUserScriptListExports.errorType.ModuleNotFound, error.message);
    }
    return actionResultError(askUserScriptListExports.errorType.ScriptInvalid, getErrorMessage(error));
  }
};

/**
 * One unit of runner work inside the sandbox: fetch the built file, load the service's script
 * modules, then either run the named export against the pure processor list only, or just
 * load the module and report its exports. The whole answer is an EitherActionResult so it
 * crosses the process and lambda boundaries as plain JSON.
 */
export const handleUserScriptRunnerEvent = async (
  event: UserScriptRunnerEvent,
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  fetchSource: (sourceUrl: string) => Promise<string> = fetchUserScriptSource,
): Promise<UserScriptRunnerResult> => {
  const notFoundType =
    event.request.kind === UserScriptRunnerRequestKind.listExports ? askUserScriptListExports.errorType.ScriptNotFound : errorType.ScriptNotFound;

  let source: string;
  try {
    source = await fetchSource(event.sourceUrl);
  } catch (error) {
    return {
      success: false,
      error: resolveActionResultError(
        actionResultError(notFoundType, `User script [${event.filename}] could not be fetched: ${getErrorMessage(error)}`),
      ),
    };
  }

  const modules = getUserScriptModuleMap(await loadUserScriptHostModules(qpqConfig, dynamicModuleLoader));

  const result =
    event.request.kind === UserScriptRunnerRequestKind.listExports
      ? listExports(event.filename, source, modules)
      : await runUserScript({
          source,
          filename: event.filename,
          functionName: event.request.functionName,
          args: event.request.args,
          modules,
          resolveStory: createRuntime(
            qpqConfig,
            event.storySession,
            getUserScriptRunnerActionProcessors,
            () => new Date().toISOString(),
            silentLogger,
            `${event.filename}::${randomUUID()}`,
            QpqRuntimeType.EXECUTE_STORY,
            dynamicModuleLoader,
          ),
        });

  return isErroredActionResult(result)
    ? { success: false, error: resolveActionResultError(result) }
    : { success: true, result: resolveActionResult(result) };
};

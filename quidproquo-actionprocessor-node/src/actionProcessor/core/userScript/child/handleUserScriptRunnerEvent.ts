import {
  actionResultError,
  askUserScriptExecuteBase,
  createRuntime,
  DynamicModuleLoader,
  isErroredActionResult,
  QPQConfig,
  QpqLogger,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptRunnerEvent,
  UserScriptRunnerResult,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { getUserScriptRunnerActionProcessors } from '../getUserScriptRunnerActionProcessors';
import { getUserScriptModuleMap } from '../logic/getUserScriptModuleMap';
import { loadUserScriptHostModules } from '../logic/loadUserScriptHostModules';
import { runUserScript } from '../logic/runUserScript';
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

/**
 * One script call inside the sandbox: fetch the built file, load the service's script
 * modules, and run the export against the pure processor list only. The whole answer is
 * an EitherActionResult so it crosses the process and lambda boundaries as plain JSON.
 */
export const handleUserScriptRunnerEvent = async (
  event: UserScriptRunnerEvent,
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  fetchSource: (sourceUrl: string) => Promise<string> = fetchUserScriptSource,
): Promise<UserScriptRunnerResult> => {
  let source: string;
  try {
    source = await fetchSource(event.sourceUrl);
  } catch (error) {
    return {
      success: false,
      error: resolveActionResultError(
        actionResultError(errorType.ScriptNotFound, `User script [${event.filename}] could not be fetched: ${getErrorMessage(error)}`),
      ),
    };
  }

  const hostModules = await loadUserScriptHostModules(qpqConfig, dynamicModuleLoader);

  const resolveStory = createRuntime(
    qpqConfig,
    event.storySession,
    getUserScriptRunnerActionProcessors,
    () => new Date().toISOString(),
    silentLogger,
    `${event.filename}::${randomUUID()}`,
    QpqRuntimeType.EXECUTE_STORY,
    dynamicModuleLoader,
  );

  const result = await runUserScript({
    source,
    filename: event.filename,
    functionName: event.functionName,
    args: event.args,
    modules: getUserScriptModuleMap(hostModules),
    resolveStory,
  });

  return isErroredActionResult(result)
    ? { success: false, error: resolveActionResultError(result) }
    : { success: true, result: resolveActionResult(result) };
};

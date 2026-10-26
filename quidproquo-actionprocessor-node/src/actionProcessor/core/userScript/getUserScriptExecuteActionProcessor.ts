import {
  ActionProcessorList,
  actionResultError,
  askFileReadTextContents,
  askUserScriptExecuteBase,
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
  UserScriptExecuteActionPayload,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { getUserScriptModuleMap } from './logic/getUserScriptModuleMap';
import { loadUserScriptHostModules } from './logic/loadUserScriptHostModules';
import { runUserScript } from './logic/runUserScript';

const getDateNow = () => new Date().toISOString();

const { errorType } = askUserScriptExecuteBase;

// The read's typed errors re-labelled into this action's catalog; any other read
// failure passes through with its own type.
const READ_ERROR_TYPES: Record<string, string> = {
  [askFileReadTextContents.errorType.FileNotFound]: errorType.ScriptNotFound,
  [askFileReadTextContents.errorType.InvalidScope]: errorType.InvalidScope,
  [askFileReadTextContents.errorType.InvalidStorageClass]: errorType.InvalidStorageClass,
};

const getProcessExecute = <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptExecuteBase> => {
  return async (
    payload: UserScriptExecuteActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ): Promise<any> => {
    const entryPath = payload.filepath;
    const label = `${payload.drive}:${entryPath}#${payload.functionName}`;

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

    // The built file is read through the file action so each runtime's own drive
    // implementation serves it; this processor never touches storage itself.
    const readResult = await resolveStory(() => askFileReadTextContents(payload.drive, entryPath, payload.scope), []);
    if (readResult.error) {
      const readErrorType = READ_ERROR_TYPES[readResult.error.errorType] ?? readResult.error.errorType;
      if (readErrorType === errorType.ScriptNotFound) {
        return actionResultError(readErrorType, `User script not found: [${payload.drive}:${entryPath}]`);
      }
      return actionResultError(readErrorType, readResult.error.errorText);
    }

    // A declared module that fails to load is the service's fault, not the script's, so it
    // throws out of the processor rather than being reported as one of the script's errors.
    const hostModules = await loadUserScriptHostModules(qpqConfig, dynamicModuleLoader);

    return runUserScript<R>({
      source: readResult.result as string,
      filename: entryPath,
      functionName: payload.functionName,
      args: payload.args,
      modules: getUserScriptModuleMap(hostModules),
      resolveStory,
      label,
    });
  };
};

export const getUserScriptExecuteActionProcessor = createActionProcessor(askUserScriptExecuteBase, getProcessExecute);

import {
  ActionProcessorList,
  actionResult,
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
  storyResultToActionResult,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
  UserScriptExecuteActionPayload,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { isStoryIterator } from '../logic/isStoryIterator';
import { getUserScriptModuleMap } from './logic/getUserScriptModuleMap';
import { loadUserScriptModule } from './logic/loadUserScriptModule';
import { UserScriptModuleNotFoundError } from './logic/UserScriptModuleNotFoundError';

const USER_SCRIPT_ENTRY_FILENAME = 'main.js';

const getDateNow = () => new Date().toISOString();

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

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
    const entryPath = `${payload.directory.replace(/\/+$/, '')}/${USER_SCRIPT_ENTRY_FILENAME}`;
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

    // The entry is read through the file action so each runtime's own drive
    // implementation serves it; this processor never touches storage itself.
    const readResult = await resolveStory(() => askFileReadTextContents(payload.drive, entryPath, payload.scope), []);
    if (readResult.error) {
      const readErrorType = READ_ERROR_TYPES[readResult.error.errorType] ?? readResult.error.errorType;
      if (readErrorType === errorType.ScriptNotFound) {
        return actionResultError(readErrorType, `User script not found: [${payload.drive}:${entryPath}]`);
      }
      return actionResultError(readErrorType, readResult.error.errorText);
    }

    let scriptExports: Record<string, unknown>;
    try {
      scriptExports = loadUserScriptModule(entryPath, readResult.result as string, getUserScriptModuleMap());
    } catch (error) {
      if (error instanceof UserScriptModuleNotFoundError) {
        return actionResultError(errorType.ModuleNotFound, error.message);
      }
      return actionResultError(errorType.ScriptInvalid, getErrorMessage(error));
    }

    // Own enumerable function properties only: the module's exports ARE the callable
    // surface, nothing is reachable through the prototype.
    const member = Object.prototype.hasOwnProperty.call(scriptExports, payload.functionName) ? scriptExports[payload.functionName] : undefined;

    if (typeof member !== 'function') {
      return actionResultError(errorType.FunctionNotFound, `Function not found: [${label}]`);
    }

    let invocationResult: unknown;
    try {
      invocationResult = member(...payload.args);
    } catch (error) {
      return actionResultError(errorType.FunctionThrew, `[${label}] threw: ${getErrorMessage(error)}`);
    }

    if (isStoryIterator(invocationResult)) {
      // The member was already invoked to discover it is a story; the thunk hands
      // the live iterator to the runtime without invoking it a second time.
      const storyResult = await resolveStory(() => invocationResult, []);

      return storyResultToActionResult<R>(storyResult, label);
    }

    try {
      return actionResult<R>((await invocationResult) as R);
    } catch (error) {
      return actionResultError(errorType.FunctionThrew, `[${label}] threw: ${getErrorMessage(error)}`);
    }
  };
};

export const getUserScriptExecuteActionProcessor = createActionProcessor(askUserScriptExecuteBase, getProcessExecute);

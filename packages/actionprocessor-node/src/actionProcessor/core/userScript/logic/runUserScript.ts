import {
  ActionProcessorResult,
  actionResult,
  actionResultError,
  askUserScriptExecuteBase,
  createRuntime,
  storyResultToActionResult,
} from '@qpqjs/core';

import { isStoryIterator } from '../../logic/isStoryIterator';
import { loadUserScriptModule } from './loadUserScriptModule';
import { UserScriptModuleMap } from './UserScriptModuleMap';
import { UserScriptModuleNotFoundError } from './UserScriptModuleNotFoundError';

const { errorType } = askUserScriptExecuteBase;

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export type RunUserScriptInput = {
  // The built script's text and the name it is known by in errors and stack traces.
  source: string;
  filename: string;
  functionName: string;
  args: unknown[];
  modules: UserScriptModuleMap;
  // Drives a generator export as a nested story; its processor list is the script's whole world.
  resolveStory: ReturnType<typeof createRuntime>;
  // Prefix for error messages, e.g. `drive:path#fn`; defaults to `filename#functionName`.
  label?: string;
};

/**
 * The one place a user script is loaded and one export called, inside a sandbox's child
 * process. A generator export is driven through `resolveStory`, a promise is
 * awaited, anything else is returned as is. Every failure maps onto the execute catalog,
 * except an error thrown by the script's own story, which keeps its type.
 */
export const runUserScript = async <R>(input: RunUserScriptInput): Promise<ActionProcessorResult<R>> => {
  const label = input.label ?? `${input.filename}#${input.functionName}`;

  let scriptExports: Record<string, unknown>;
  try {
    scriptExports = loadUserScriptModule(input.filename, input.source, input.modules);
  } catch (error) {
    if (error instanceof UserScriptModuleNotFoundError) {
      return actionResultError(errorType.ModuleNotFound, error.message);
    }
    return actionResultError(errorType.ScriptInvalid, getErrorMessage(error));
  }

  // Own enumerable function properties only: the module's exports ARE the callable
  // surface, nothing is reachable through the prototype.
  const member = Object.prototype.hasOwnProperty.call(scriptExports, input.functionName) ? scriptExports[input.functionName] : undefined;

  if (typeof member !== 'function') {
    return actionResultError(errorType.FunctionNotFound, `Function not found: [${label}]`);
  }

  let invocationResult: unknown;
  try {
    invocationResult = member(...input.args);
  } catch (error) {
    return actionResultError(errorType.FunctionThrew, `[${label}] threw: ${getErrorMessage(error)}`);
  }

  if (isStoryIterator(invocationResult)) {
    // The member was already invoked to discover it is a story; the thunk hands
    // the live iterator to the runtime without invoking it a second time.
    const storyResult = await input.resolveStory(() => invocationResult, []);

    return storyResultToActionResult<R>(storyResult, label);
  }

  try {
    return actionResult<R>((await invocationResult) as R);
  } catch (error) {
    return actionResultError(errorType.FunctionThrew, `[${label}] threw: ${getErrorMessage(error)}`);
  }
};

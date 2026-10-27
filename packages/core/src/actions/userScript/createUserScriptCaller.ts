import { DynamicFunctions } from '../dynamicFunctions/askDynamicFunctionExecute';
import { DynamicFunctionCaller } from '../dynamicFunctions/createDynamicFunctionCaller';
import { askUserScriptExecute } from './askUserScriptExecute';

/**
 * Typed sugar over askUserScriptExecute: caller.someMember(a, b) yields the same
 * Execute action as askUserScriptExecute(drive, filepath, 'someMember', a, b).
 * `create*`, not `ask*`: it returns requester generators rather than being one.
 */
export const createUserScriptCaller = <TFunctions extends DynamicFunctions>(drive: string, filepath: string): DynamicFunctionCaller<TFunctions> =>
  // The Proxy IS the mapped type: member names only exist at the type level, so the
  // casts restate that every property access is a call onto the named member.
  new Proxy({} as DynamicFunctionCaller<TFunctions>, {
    get:
      (_target, functionName) =>
      (...args: unknown[]) =>
        askUserScriptExecute(drive, filepath, String(functionName), ...args),
  });

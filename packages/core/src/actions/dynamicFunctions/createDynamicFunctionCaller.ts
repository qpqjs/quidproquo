import { AskResponse } from '../../types/StorySession';
import { askDynamicFunctionExecute } from './askDynamicFunctionExecute';
import { DynamicFunctionResult, DynamicFunctions } from './askDynamicFunctionExecute';

export type DynamicFunctionCaller<TFunctions extends DynamicFunctions> = {
  [TName in keyof TFunctions]: (...args: Parameters<TFunctions[TName]>) => AskResponse<DynamicFunctionResult<TFunctions[TName]>>;
};

// Typed sugar over askDynamicFunctionExecute: caller.someMember(a, b) yields the
// same Execute action as askDynamicFunctionExecute(name, 'someMember', a, b).
// `create*`, not `ask*`: it returns requester generators rather than being one.
export const createDynamicFunctionCaller = <TFunctions extends DynamicFunctions>(dynamicFunctionsName: string): DynamicFunctionCaller<TFunctions> =>
  // The Proxy IS the mapped type: member names only exist at the type level, so the
  // casts restate that every property access is a call onto the named member.
  new Proxy({} as DynamicFunctionCaller<TFunctions>, {
    get:
      (_target, functionName) =>
      (...args: unknown[]) =>
        askDynamicFunctionExecute(dynamicFunctionsName, String(functionName), ...args),
  });

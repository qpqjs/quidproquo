import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { DynamicFunctionsActionType } from './DynamicFunctionsActionType';

// The full catalog of errors the Execute processor can produce itself. Errors
// thrown by a generator member's own story propagate with their original type.
// The shape a registered export must have: an object of callable members. `any` is
// required here - member parameters are contravariant, so a Record over `unknown[]`
// args would reject every concretely-typed functions object.
export type DynamicFunctions = Record<string, (...args: any[]) => any>;
// What the processor hands back for a member: a generator member resolves to its
// story return value, a promise-returning member to its awaited value.
export type DynamicFunctionResult<TFn extends (...args: any[]) => any> =
  ReturnType<TFn> extends Generator<any, infer R, any> ? R : ReturnType<TFn> extends Promise<infer R> ? R : ReturnType<TFn>;
export type DynamicFunctionsExecuteActionPayload = {
  dynamicFunctionsName: string;
  functionName: string;
  args: unknown[];
};

export const askDynamicFunctionExecuteBase = createActionRequester<unknown>()({
  actionType: DynamicFunctionsActionType.Execute,
  errorTypes: [
    'DynamicFunctionsNotFound', // no dynamic functions definition is registered under dynamicFunctionsName
    'ModuleLoadFailed', // the definition's module could not be loaded
    'FunctionNotFound', // the module has no function under functionName
    'FunctionThrew', // the function threw, or its story or promise failed
  ],
  getPayload: (dynamicFunctionsName: string, functionName: string, args: unknown[]) => ({ dynamicFunctionsName, functionName, args }),
});

// Invoke one member of a registered dynamic-functions object (see
// defineDynamicFunctions) by name, with positional args. Type the seam by passing
// the object's type: askDynamicFunctionExecute<typeof templateEventDoc>(...) checks
// the member name, its args, and infers the (story-unwrapped) result.
function* askDynamicFunctionExecuteTyped<
  TFunctions extends DynamicFunctions = DynamicFunctions,
  TName extends keyof TFunctions & string = keyof TFunctions & string,
>(dynamicFunctionsName: string, functionName: TName, ...args: Parameters<TFunctions[TName]>): AskResponse<DynamicFunctionResult<TFunctions[TName]>> {
  return (yield* askDynamicFunctionExecuteBase(dynamicFunctionsName, functionName, args)) as DynamicFunctionResult<TFunctions[TName]>;
}

/** Calls one function of a registered dynamic functions definition. Carries the base requester's `errorType` catalog so callers can match on it. */
export const askDynamicFunctionExecute = Object.assign(askDynamicFunctionExecuteTyped, { errorType: askDynamicFunctionExecuteBase.errorType });

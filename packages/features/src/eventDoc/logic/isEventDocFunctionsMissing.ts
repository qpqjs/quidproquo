import { DynamicFunctionsExecuteErrorTypeEnum } from 'quidproquo-core';

/**
 * True when a dynamic-functions call failed because nothing is registered for the collection or the member is absent.
 * ModuleLoadFailed is deliberately excluded: a registered object that cannot load must stay loud.
 */
export const isEventDocFunctionsMissing = (errorType: string): boolean =>
  errorType === DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound || errorType === DynamicFunctionsExecuteErrorTypeEnum.FunctionNotFound;

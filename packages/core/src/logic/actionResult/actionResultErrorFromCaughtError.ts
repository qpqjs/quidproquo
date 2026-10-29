import { ActionProcessorResult } from '../../types/Action';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { isTransientErrorName } from '../transientErrorNames';
import { actionResultError } from './actionResultError';

type ErrorMap = { [key: string]: (error: Error) => ActionProcessorResult<any> };

export const actionResultErrorFromCaughtError = (error: unknown, errorMap: ErrorMap = {}): ReturnType<typeof actionResultError> => {
  if (error instanceof Error) {
    const errorCode = (error as any).code as string | undefined;
    const errorName = error.name;

    // Prefer the OS/runtime code (node fs: EACCES, ENOENT...), then fall back
    // to the error name (AWS SDK: AccessDenied, NoSuchBucket...).
    const handler = (errorCode && errorMap[errorCode]) || errorMap[errorName];
    if (handler) {
      return handler(error);
    }

    const unmappedKey = errorCode ?? errorName;

    // Classify throttles and transient service failures BEFORE the generic fallback, so a caller can tell
    // "the service is busy" from "this request is wrong" without matching on error text. Without this they
    // are indistinguishable GenericErrors, and a caller that records failures durably writes a permanent
    // failure for something that would have succeeded on the next attempt.
    if (isTransientErrorName(errorCode) || isTransientErrorName(errorName)) {
      return actionResultError(ErrorTypeEnum.OutOfResources, `A transient error occurred, retry [${unmappedKey}].`);
    }

    return actionResultError(ErrorTypeEnum.GenericError, `An unexpected error occurred [${unmappedKey}].`);
  }

  return actionResultError(ErrorTypeEnum.GenericError, 'An unknown error occurred.');
};

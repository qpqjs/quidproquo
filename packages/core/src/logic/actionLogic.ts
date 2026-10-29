import { ActionProcessorResult, EitherActionResult } from '../types/Action';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';
import { QPQError } from '../types/ErrorTypeEnum';
import { isTransientErrorName } from './transientErrorNames';

export const getSuccessfulEitherActionResult = <T>(result: T): EitherActionResult<T> => ({
  success: true,
  result,
});

export const getUnsuccessfulEitherActionResult = (error: QPQError): EitherActionResult<any> => ({
  success: false,
  error: error,
});

export const actionResultError = (errorType: ErrorTypeEnum | string, errorText: string, errorStack?: string): ActionProcessorResult<any> => {
  return [undefined, { errorType, errorText, errorStack }];
};

export const actionResult = <T>(result: T): ActionProcessorResult<T> => {
  return [result];
};

export const isErroredActionResult = <T>(actionResult: ActionProcessorResult<T>): boolean => {
  return !actionResult || !!actionResult[1];
};

export const resolveActionResult = <T>(actionResult: ActionProcessorResult<T>) => {
  // We say that it has to have a value, otherwise don't call this function
  // use isErroredActionResult to check
  return actionResult[0]!;
};

export const resolveActionResultError = <T>(actionResult: ActionProcessorResult<T>): QPQError => {
  if (!actionResult) {
    return {
      errorText: `Action processor returned no result [${JSON.stringify(actionResult)}]`,
      errorType: ErrorTypeEnum.GenericError,
    };
  }

  return actionResult[1] as QPQError;
};

type ErrorMap = { [key: string]: (error: Error) => ActionProcessorResult<any> };

export const actionResultErrorFromCaughtError = (error: unknown, errorMap: ErrorMap): ReturnType<typeof actionResultError> => {
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

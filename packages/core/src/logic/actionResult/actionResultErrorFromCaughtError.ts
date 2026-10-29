import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { actionResultError } from './actionResultError';
import { ErrorMap } from './ErrorMap';

// The generic fallback knows nothing about any platform: a name the map does not carry is a
// GenericError. Transient classification is a map entry too (see transientErrorMap).
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

    return actionResultError(ErrorTypeEnum.GenericError, `An unexpected error occurred [${errorCode ?? errorName}].`);
  }

  return actionResultError(ErrorTypeEnum.GenericError, 'An unknown error occurred.');
};

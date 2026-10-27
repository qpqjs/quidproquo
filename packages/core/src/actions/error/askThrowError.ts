import { QPQError } from '../../types/ErrorTypeEnum';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { ErrorActionType } from './ErrorActionType';

export const askThrowErrorBase = createActionRequester<never>()({
  actionType: ErrorActionType.ThrowError,
  getPayload: (errorType: QPQError['errorType'], errorText: QPQError['errorText'], errorStack?: QPQError['errorStack']) => ({
    errorType,
    errorText,
    errorStack,
  }),
});

// Control never returns here, so T is whatever the calling story's return type needs:
// `return yield* askThrowError(...)` type-checks in any position.
export function* askThrowError<T>(
  errorType: QPQError['errorType'],
  errorText: QPQError['errorText'],
  errorStack?: QPQError['errorStack'],
): AskResponse<T> {
  return (yield* askThrowErrorBase(errorType, errorText, errorStack)) as T;
}

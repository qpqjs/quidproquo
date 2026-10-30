import { ActionProcessorResult } from '../../types/Action';
import { ErrorTypeEnum, QPQError } from '../../types/ErrorTypeEnum';

export const resolveActionResultError = <T>(actionResult: ActionProcessorResult<T>): QPQError => {
  if (!actionResult) {
    return {
      errorText: `Action processor returned no result [${JSON.stringify(actionResult)}]`,
      errorType: ErrorTypeEnum.GenericError,
    };
  }

  return actionResult[1] as QPQError;
};

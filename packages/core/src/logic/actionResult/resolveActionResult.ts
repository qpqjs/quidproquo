import { ActionProcessorResult } from '../../types/Action';

export const resolveActionResult = <T>(actionResult: ActionProcessorResult<T>) => {
  // We say that it has to have a value, otherwise don't call this function
  // use isErroredActionResult to check
  return actionResult[0]!;
};

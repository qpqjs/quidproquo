import { ActionProcessorResult } from '../../types/Action';

export const isErroredActionResult = <T>(actionResult: ActionProcessorResult<T>): boolean => {
  return !actionResult || !!actionResult[1];
};

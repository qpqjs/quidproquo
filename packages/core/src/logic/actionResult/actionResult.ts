import { ActionProcessorResult } from '../../types/Action';

export const actionResult = <T>(result: T): ActionProcessorResult<T> => {
  return [result];
};

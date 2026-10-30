import { EitherActionResult } from '../../types/Action';

export const getSuccessfulEitherActionResult = <T>(result: T): EitherActionResult<T> => ({
  success: true,
  result,
});

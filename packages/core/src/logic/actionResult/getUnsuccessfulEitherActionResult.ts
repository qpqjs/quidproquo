import { EitherActionResult } from '../../types/Action';
import { QPQError } from '../../types/ErrorTypeEnum';

export const getUnsuccessfulEitherActionResult = (error: QPQError): EitherActionResult<any> => ({
  success: false,
  error: error,
});

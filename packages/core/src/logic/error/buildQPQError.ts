import { QPQError } from '../../types';

export function buildQPQError(errorType: QPQError['errorType'], errorText: QPQError['errorText'], errorStack?: QPQError['errorStack']): QPQError {
  return {
    errorType,
    errorText,
    errorStack,
  };
}

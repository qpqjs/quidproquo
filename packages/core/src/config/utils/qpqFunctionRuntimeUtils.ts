import { QpqFunctionRuntime } from '../../types';
import { isQpqFunctionRuntimeAdvanced } from '../../utils';

export enum InvalidQpqFunctionRuntimeErrorCode {
  // A string runtime without a '::<functionName>' suffix.
  missingFunctionName = 'missingFunctionName',
}

// Raised at config-definition time when a runtime string is malformed. The
// story name feeds unique keys and deployed resource names, so a missing
// '::' must fail fast rather than leak the literal string "undefined" into
// resource names downstream.
export class InvalidQpqFunctionRuntimeError extends Error {
  constructor(
    public readonly code: InvalidQpqFunctionRuntimeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidQpqFunctionRuntimeError';
  }
}

export const getStoryNameFromQpqFunctionRuntime = (qpqFunctionRuntime: QpqFunctionRuntime): string => {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return qpqFunctionRuntime.functionName;
  }

  const [_srcPath, method] = qpqFunctionRuntime.split('::');

  if (!method) {
    throw new InvalidQpqFunctionRuntimeError(
      InvalidQpqFunctionRuntimeErrorCode.missingFunctionName,
      `Runtime "${qpqFunctionRuntime}" must be in the form "<srcPath>::<functionName>"`,
    );
  }

  return method;
};

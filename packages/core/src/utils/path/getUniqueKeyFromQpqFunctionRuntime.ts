import { QpqFunctionRuntime } from '../../types';
import { isQpqFunctionRuntimeAdvanced } from './isQpqFunctionRuntimeAdvanced';

export function getUniqueKeyFromQpqFunctionRuntime(qpqFunctionRuntime: QpqFunctionRuntime): string {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return `${qpqFunctionRuntime.basePath}/${qpqFunctionRuntime.relativePath}::${qpqFunctionRuntime.functionName}`;
  }

  return qpqFunctionRuntime;
}

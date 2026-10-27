import { QpqFunctionRuntime, QpqFunctionRuntimeRelativePath } from '../../types';

export function isQpqFunctionRuntimeRelativePath(qpqFunctionRuntime: QpqFunctionRuntime): qpqFunctionRuntime is QpqFunctionRuntimeRelativePath {
  return typeof qpqFunctionRuntime !== 'object';
}

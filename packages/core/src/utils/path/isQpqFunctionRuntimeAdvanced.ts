import { QpqFunctionRuntime, QpqFunctionRuntimeAdvanced } from '../../types';

export function isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime: QpqFunctionRuntime): qpqFunctionRuntime is QpqFunctionRuntimeAdvanced {
  return typeof qpqFunctionRuntime === 'object';
}

import { QpqFunctionRuntime } from '../../types/QpqFunctionRuntime';
import { isQpqFunctionRuntimeAdvanced } from './isQpqFunctionRuntimeAdvanced';

// The function-scoped globals attached to a runtime, if any. Only advanced
// runtimes can carry them; a relative-path runtime resolves to undefined.
export const getGlobalsFromQpqFunctionRuntime = (runtime?: QpqFunctionRuntime): Record<string, unknown> | undefined => {
  return runtime && isQpqFunctionRuntimeAdvanced(runtime) ? runtime.globals : undefined;
};

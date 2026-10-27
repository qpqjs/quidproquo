import { QpqFunctionRuntime } from '../../types/QpqFunctionRuntime';
import { isQpqFunctionRuntimeAdvanced } from './isQpqFunctionRuntimeAdvanced';

// The action processor override sources attached to a runtime, if any. Only
// advanced runtimes can carry them; a relative-path runtime resolves to undefined.
export const getActionProcessorsFromQpqFunctionRuntime = (runtime?: QpqFunctionRuntime): QpqFunctionRuntime[] | undefined => {
  return runtime && isQpqFunctionRuntimeAdvanced(runtime) ? runtime.actionProcessors : undefined;
};

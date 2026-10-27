import { QpqFunctionRuntime } from '../../types';
import { isQpqFunctionRuntimeAdvanced } from './isQpqFunctionRuntimeAdvanced';

// A machine-INDEPENDENT identity key for a runtime, used to match a published
// federated module against the runtime the lambda asks for.
//
// getUniqueKeyFromQpqFunctionRuntime is unsuitable here: for advanced runtimes it
// embeds `basePath`, an absolute filesystem path. Federation deliberately builds
// the lambda shell and publishes the artifacts as separate steps (often on
// different machines / CI), so an absolute path in the key makes the publisher's
// manifest key never equal the lambda's lookup key. We key on the relative path +
// function name instead, which is stable across machines.
export function getFederatedKeyFromQpqFunctionRuntime(qpqFunctionRuntime: QpqFunctionRuntime): string {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    const relativePath = qpqFunctionRuntime.relativePath.replace(/\\/g, '/').replace(/^\//, '');
    return `${relativePath}::${qpqFunctionRuntime.functionName}`;
  }

  // Relative-string runtimes are already machine-independent.
  return qpqFunctionRuntime;
}

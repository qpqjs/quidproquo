import { QpqFunctionRuntimeAdvanced } from 'quidproquo-core';

// Builds a runtime pointer to an entry file inside this package, so feature
// configs can wire handlers that resolve from the compiled features output.
export const getFeatureEntryQpqFunctionRuntime = (
  featurePath: string,
  entryType: string,
  runtime: `${string}::${string}`,
): QpqFunctionRuntimeAdvanced => {
  const [src, methodName] = runtime.split('::');

  return {
    basePath: __dirname,
    relativePath: `${featurePath}/entry/${entryType}/${src}`,
    functionName: methodName,
  };
};

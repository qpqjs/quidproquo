import { QpqFunctionRuntimeAdvanced } from '@qpqjs/core';

export const getServiceEntryQpqFunctionRuntime = (
  serviceName: string,
  entryType: string,
  // TODO: @joe-coady: runtime should maybe be QpqFunctionRuntimeRelativePath
  runtime: `${string}::${string}`,
): QpqFunctionRuntimeAdvanced => {
  const [src, methodName] = runtime.split('::');

  return {
    basePath: __dirname,
    relativePath: `${serviceName}/entry/${entryType}/${src}`,
    functionName: methodName,
  };
};

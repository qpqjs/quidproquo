import { qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import path from 'path';

import { getFullSrcPathFromQpqFunctionRuntime } from './getFullSrcPathFromQpqFunctionRuntime';

/**
 * Generates the JavaScript source (as a string) that forms the body of the generated
 * `quidproquo-dynamic-loader` virtual module's loader: the code that turns a
 * QpqFunctionRuntime into its loaded story at runtime.
 *
 * For every QpqFunctionRuntime the config references (core + webserver src entries), it
 * emits an `if` guard that matches the incoming runtime (string equality for relative
 * runtimes, or `basePath`/`relativePath`/`functionName` equality for advanced ones) and,
 * on a match, `require()`s that runtime's source file and returns its named story export.
 * Because those `require()` paths are string literals, the bundler statically resolves
 * them and bundles every referenced module into the lambda zip.
 *
 * If the service opted into federation with `bundleFallback: false` (a "thin shell"), it
 * instead emits a single fail-fast `throw` and NO `require()` calls, so no user story code
 * is bundled; the lambda then runs only federated code and errors loudly if nothing is
 * published for the requested runtime.
 *
 * @param {QPQConfig} qpqConfig - the service config whose src entries the loader covers.
 * @param {string} qpqFunctionRuntimeVariableName - the identifier of the runtime variable
 *   in the generated code that each guard compares against (e.g. `'qpqFunctionRuntime'`).
 * @param {boolean} [alwaysBundleStoryCode] - emit the require() if-chain even for a
 *   thin-shell service (bundleFallback:false). The dev-server build sets this: thin
 *   shells only exist to keep lambda zips small, which is meaningless locally, and the
 *   dev server has no federated store to load from.
 * @returns {string} JavaScript source to inline into the generated loader function body.
 */
export function getSrcLoaderForQpqConfig(qpqConfig, qpqFunctionRuntimeVariableName, alwaysBundleStoryCode) {
  // Thin shell: the service opted into federation with bundleFallback:false, so emit
  // NO require() calls (the bundler then bundles no user story code) and fail fast. The
  // federated loader runs first in dynamicModuleLoader; reaching here means nothing was
  // published for this runtime, which for a thin shell is a hard error, not a fallback.
  const federatedStore = qpqCoreUtils.getFederatedModuleStore(qpqConfig);
  if (!alwaysBundleStoryCode && federatedStore && federatedStore.bundleFallback === false) {
    return `throw new Error('No federated module published for [' + JSON.stringify(${qpqFunctionRuntimeVariableName}) + '] and bundleFallback is disabled - publish the service\\'s federated remote');`;
  }

  const allQpqFunctionRuntimes = [...qpqCoreUtils.getAllSrcEntries(qpqConfig), ...qpqWebServerUtils.getAllSrcEntries(qpqConfig)];

  const ifStatements = allQpqFunctionRuntimes.map((qpqFunctionRuntime) => {
    const fullPath = getFullSrcPathFromQpqFunctionRuntime(qpqFunctionRuntime, qpqConfig);
    const method = qpqCoreUtils.getStoryNameFromQpqFunctionRuntime(qpqFunctionRuntime);
    // Forward slashes so the emitted require('<path>') literal stays valid on Windows.
    const srcPath = path.posix.join(fullPath.replace(/\\/g, '/'));

    return `
      if (typeof ${qpqFunctionRuntimeVariableName} === '${typeof qpqFunctionRuntime}' && !!${qpqFunctionRuntimeVariableName}) {
        if (
          ${
            typeof qpqFunctionRuntime === 'string'
              ? `(${qpqFunctionRuntimeVariableName} === String.raw\`${qpqFunctionRuntime}\`)`
              : `(
                ${qpqFunctionRuntimeVariableName}.basePath === String.raw\`${qpqFunctionRuntime.basePath}\` &&
                ${qpqFunctionRuntimeVariableName}.relativePath === String.raw\`${qpqFunctionRuntime.relativePath}\` &&
                ${qpqFunctionRuntimeVariableName}.functionName === String.raw\`${qpqFunctionRuntime.functionName}\`
              )`
          }
        ) {
          const module = await require('${srcPath}');
          if (!module) {
            throw new Error('Unable to dynamically load module');
          }

          const story = module['${method}'];
          if (!story) {
            throw new Error(\`Unable to dynamically load story: [${method}] in ['${srcPath}']\`);
          }

          return story;
        }
      }
`;
  });

  return ifStatements.join('\n');
}

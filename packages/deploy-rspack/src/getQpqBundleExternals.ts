import { getLayerProvidedModules } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { ExternalItem } from '@rspack/core';

// Externalize every package the runtime environment provides (lambda layer
// modules from `ApiLayer.modules` plus the `defineBackendBundleOptions`
// externals escape hatch), including subpath imports like `pkg/bin/foo`.
export const getQpqBundleExternals = (qpqConfig: QPQConfig): ExternalItem[] => {
  const externalModules = [...getLayerProvidedModules(qpqConfig), ...qpqCoreUtils.getBackendBundleOptions(qpqConfig).externals];

  if (externalModules.length === 0) {
    return [];
  }

  return [
    ({ request }, callback) => {
      const isExternal = externalModules.some((externalModule) => request === externalModule || request?.startsWith(`${externalModule}/`));

      if (isExternal) {
        return callback(undefined, `commonjs2 ${request}`);
      }

      callback();
    },
  ];
};

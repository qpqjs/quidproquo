import { DynamicModuleLoader, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { UserScriptHostModuleLoadError } from './UserScriptHostModuleLoadError';
import { UserScriptModuleMap } from './UserScriptModuleMap';

/**
 * The modules this service lets user scripts import (defineUserScriptModule), loaded through
 * the dynamic module loader and keyed by import name, ready to merge into the module map.
 * Throws UserScriptHostModuleLoadError when a declared module does not load, since a script
 * importing it could then only fail in a misleading way.
 */
export const loadUserScriptHostModules = async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<UserScriptModuleMap> => {
  const declared = qpqCoreUtils.getAllUserScriptModules(qpqConfig);
  const modules: UserScriptModuleMap = {};

  for (const { moduleName, runtime } of declared) {
    const loaded = await dynamicModuleLoader(runtime);
    if (!loaded) {
      throw new UserScriptHostModuleLoadError(moduleName);
    }
    modules[moduleName] = loaded;
  }

  return modules;
};

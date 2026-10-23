import { FEDERATED_SHARED_PACKAGE_NAMES } from '../../constants/federatedSharedPackageNames';
import { QpqFunctionRuntime } from '../../types';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface UserScriptModuleQPQConfigSetting extends QPQConfigSetting {
  // The import specifier a user script uses, e.g. `my-app-sdk/v1`.
  moduleName: string;
  runtime: QpqFunctionRuntime;
}

/**
 * Lets user scripts on this service import a module the service provides. `runtime`
 * points at an exported OBJECT (as with defineDynamicFunctions); that object is what a
 * script gets for `import ... from moduleName`. A build keeps the import external, and
 * the build's output check and askUserScriptExecute hand the script the service's own
 * instance, loaded through the dynamic module loader. The module ships with the service,
 * so its actions run through the service's processors.
 *
 * A name may not shadow a shared framework package (`quidproquo-core`), which the host
 * already provides.
 */
export const defineUserScriptModule = (moduleName: string, runtime: QpqFunctionRuntime): UserScriptModuleQPQConfigSetting => {
  if ((FEDERATED_SHARED_PACKAGE_NAMES as readonly string[]).includes(moduleName)) {
    throw new Error(`defineUserScriptModule: [${moduleName}] is a shared framework package and cannot be redefined`);
  }
  if (moduleName === '' || moduleName.startsWith('.') || moduleName.startsWith('/') || moduleName.startsWith('node:')) {
    throw new Error(`defineUserScriptModule: [${moduleName}] is not a package-style import name`);
  }

  return {
    configSettingType: QPQCoreConfigSettingType.userScriptModule,
    uniqueKey: moduleName,

    moduleName,
    runtime,
  };
};

import { FEDERATED_SHARED_PACKAGE_NAMES } from '../../constants/federatedSharedPackageNames';
import { USER_SCRIPT_MODULE_TYPES_EXPORT, USER_SCRIPT_MODULE_TYPES_QUERY } from '../../constants/userScriptModuleTypes';
import { QpqFunctionRuntime } from '../../types';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type UserScriptModuleQPQConfigSetting = {
  // The import specifier a user script uses, e.g. `my-app-sdk/v1`.
  moduleName: string;
  runtime: QpqFunctionRuntime;
  // Where the module's bundled type declarations load from, when it declared `types`: an
  // ordinary runtime, so the bundler ships it like any other.
  typesRuntime?: QpqFunctionRuntime;
} & QPQConfigSetting;

export type UserScriptModuleOptions = {
  /**
   * The module's TypeScript entry, as a path from the config root (the same base a runtime's
   * path uses), e.g. `/../../sdk/src/v1/index.ts`. The bundler turns it into one
   * self-contained declaration file, served by askUserScriptModuleTypes, so a script editor can
   * autocomplete and type check the import. Types from quidproquo packages are inlined.
   */
  types?: `/${string}`;
};

/**
 * Lets user scripts on this service import a module the service provides. `runtime`
 * points at an exported OBJECT (as with defineDynamicFunctions); that object is what a
 * script gets for `import ... from moduleName`. A build keeps the import external, and
 * the build's output check and askUserScriptExecute hand the script the service's own
 * instance, loaded through the dynamic module loader. The module ships with the service,
 * so its actions run through the service's processors.
 *
 * A name may not shadow a shared framework package (`@qpqjs/core`), which the host
 * already provides. With `options.types`, the module's declarations are also available to
 * editors through askUserScriptModuleTypes.
 */
export const defineUserScriptModule = (
  moduleName: string,
  runtime: QpqFunctionRuntime,
  options?: UserScriptModuleOptions,
): UserScriptModuleQPQConfigSetting => {
  if ((FEDERATED_SHARED_PACKAGE_NAMES as readonly string[]).includes(moduleName)) {
    throw new Error(`defineUserScriptModule: [${moduleName}] is a shared framework package and cannot be redefined`);
  }
  if (moduleName === '' || moduleName.startsWith('.') || moduleName.startsWith('/') || moduleName.startsWith('node:')) {
    throw new Error(`defineUserScriptModule: [${moduleName}] is not a package-style import name`);
  }

  const types = options?.types;
  if (types !== undefined && (!types.startsWith('/') || types.includes('?') || types.includes('::'))) {
    throw new Error(`defineUserScriptModule: types [${types}] must be a plain file path from the config root, starting with /`);
  }

  return {
    configSettingType: QPQCoreConfigSettingType.userScriptModule,
    uniqueKey: moduleName,

    moduleName,
    runtime,
    typesRuntime: types ? (`${types}?${USER_SCRIPT_MODULE_TYPES_QUERY}::${USER_SCRIPT_MODULE_TYPES_EXPORT}` as const) : undefined,
  };
};

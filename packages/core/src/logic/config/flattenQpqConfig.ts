import { QPQConfig, QPQConfigItem, QPQConfigSetting, QPQCoreConfigSettingType } from '../../config/QPQConfig';
import { ApplicationQPQConfigSetting } from '../../config/settings/applicationName';
import { EnvironmentSettingsQPQConfigSetting } from '../../config/settings/environmentSettings';
import { ModuleQPQConfigSetting } from '../../config/settings/moduleName';
import { ServiceSettingsQPQConfigSetting } from '../../config/settings/serviceSettings';
import { DEFAULT_ENVIRONMENT } from './DEFAULT_ENVIRONMENT';

// What the walk has learned so far about where it is: the application's environment and the
// module declared last. Both are set by the settings that precede the ones they scope.
type FlattenScope = {
  environment: string;
  service?: string;
};

// The settings an environment block contributes under this environment, else its '*' fallback.
const resolveEnvironmentSettings = (setting: EnvironmentSettingsQPQConfigSetting, scope: FlattenScope): QPQConfigItem[] =>
  setting.settingsByEnvironment[scope.environment] ?? setting.settingsByEnvironment['*'] ?? [];

// The settings a service block contributes under the current module, else its '*' fallback.
const resolveServiceSettings = (setting: ServiceSettingsQPQConfigSetting, scope: FlattenScope): QPQConfigItem[] => {
  if (!scope.service) {
    throw new Error('defineServiceSettings requires a module to be set first via defineModule (usually through defineApplicationModule)');
  }

  return setting.settingsByService[scope.service] ?? setting.settingsByService['*'] ?? [];
};

/**
 * Flattens a QPQConfig tree into one list of settings, in declaration order. Environment and
 * service blocks are opened for the environment the application named (production when it
 * named none) and the module declared before them; the blocks themselves are not kept.
 */
export const flattenQpqConfig = (qpqConfig: QPQConfig): QPQConfigSetting[] => {
  const scope: FlattenScope = { environment: DEFAULT_ENVIRONMENT };
  const settings: QPQConfigSetting[] = [];

  const visit = (items: QPQConfigItem[]): void => {
    for (const item of items) {
      if (Array.isArray(item)) {
        visit(item);
        continue;
      }

      switch (item.configSettingType) {
        case QPQCoreConfigSettingType.appName:
          scope.environment = (item as ApplicationQPQConfigSetting).environment || DEFAULT_ENVIRONMENT;
          settings.push(item);
          break;

        case QPQCoreConfigSettingType.moduleName:
          scope.service = (item as ModuleQPQConfigSetting).moduleName;
          settings.push(item);
          break;

        case QPQCoreConfigSettingType.environmentSettings:
          visit(resolveEnvironmentSettings(item as EnvironmentSettingsQPQConfigSetting, scope));
          break;

        case QPQCoreConfigSettingType.serviceSettings:
          visit(resolveServiceSettings(item as ServiceSettingsQPQConfigSetting, scope));
          break;

        default:
          settings.push(item);
      }
    }
  };

  visit(qpqConfig);

  return settings;
};

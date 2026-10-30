import { QPQConfig, QPQConfigSetting } from '../../config/QPQConfig';
import { getApplicationModuleEnvironment } from './getApplicationModuleEnvironment';
import { getApplicationModuleFeature } from './getApplicationModuleFeature';
import { getApplicationModuleName } from './getApplicationModuleName';
import { getApplicationName } from './getApplicationName';

// The settings this config's module owns: those with no owner, and those whose owner names this
// module, application, feature and environment (an omitted owner field matches anything).
export const getOwnedItems = <T extends QPQConfigSetting>(settings: T[], qpqConfig: QPQConfig): T[] => {
  const appModuleName = getApplicationModuleName(qpqConfig);
  const appName = getApplicationName(qpqConfig);
  const appFeature = getApplicationModuleFeature(qpqConfig);
  const appEnvironment = getApplicationModuleEnvironment(qpqConfig);

  return settings.filter(
    (s) =>
      !s.owner ||
      ((!s.owner.module || s.owner.module === appModuleName) &&
        (!s.owner.application || s.owner.application === appName) &&
        (s.owner.feature === undefined || (!s.owner.feature && !appFeature) || s.owner.feature === appFeature) &&
        (!s.owner.environment || s.owner.environment === appEnvironment)),
  );
};

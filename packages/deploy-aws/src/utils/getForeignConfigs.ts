import { QPQConfig, QPQConfigSetting, qpqCoreUtils } from '@qpqjs/core';

/** The settings of this config that another service owns (declared here with a cross-module owner). */
export const getForeignConfigs = <T extends QPQConfigSetting>(configs: T[], qpqConfig: QPQConfig): T[] => {
  const owned = qpqCoreUtils.getOwnedItems(configs, qpqConfig);

  return configs.filter((config) => !owned.includes(config));
};

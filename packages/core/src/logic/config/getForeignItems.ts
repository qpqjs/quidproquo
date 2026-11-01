import { QPQConfig, QPQConfigSetting } from '../../config/QPQConfig';
import { getOwnedItems } from './getOwnedItems';

/** The settings another service owns (declared here with a cross-module owner): the inverse of getOwnedItems. */
export const getForeignItems = <T extends QPQConfigSetting>(settings: T[], qpqConfig: QPQConfig): T[] => {
  const owned = getOwnedItems(settings, qpqConfig);

  return settings.filter((setting) => !owned.includes(setting));
};

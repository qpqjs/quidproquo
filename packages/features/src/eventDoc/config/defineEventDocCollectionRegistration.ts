import { EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE } from '../constants/eventDocCollectionConfigSettingType';
import { EventDocCollectionQPQConfigSetting } from '../types/EventDocCollectionQPQConfigSetting';
import { EventDocStore } from '../types/EventDocStore';

/** Records a collection in config so code that only has `qpqConfig` (e.g. an action processor) can resolve its store and hooks. */
export const defineEventDocCollectionRegistration = (store: EventDocStore, userDirectoryName?: string): EventDocCollectionQPQConfigSetting => ({
  configSettingType: EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE,
  uniqueKey: `${store.storeName}/${store.type}`,

  store,
  userDirectoryName,
});

import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE } from '../../constants/eventDocCollectionConfigSettingType';
import { EventDocCollectionQPQConfigSetting } from '../../types/EventDocCollectionQPQConfigSetting';

/** Every routed event-doc collection registered in the service. */
export const getAllEventDocCollectionConfigs = (qpqConfig: QPQConfig): EventDocCollectionQPQConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<EventDocCollectionQPQConfigSetting>(qpqConfig, EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE);

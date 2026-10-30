import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { EVENT_DOC_AI_CONFIG_SETTING_TYPE } from '../../constants/eventDocAiConfigSettingType';
import { EventDocAiQPQConfigSetting } from '../../types/EventDocAiQPQConfigSetting';

/** Every defineEventDocAi registered in the service. */
export const getAllEventDocAiConfigs = (qpqConfig: QPQConfig): EventDocAiQPQConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<EventDocAiQPQConfigSetting>(qpqConfig, EVENT_DOC_AI_CONFIG_SETTING_TYPE);

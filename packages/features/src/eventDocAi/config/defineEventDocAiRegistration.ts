import { EVENT_DOC_AI_CONFIG_SETTING_TYPE } from '../constants/eventDocAiConfigSettingType';
import { EventDocAiQPQConfigSetting } from '../types/EventDocAiQPQConfigSetting';

type EventDocAiRegistrationOptions = Omit<EventDocAiQPQConfigSetting, 'configSettingType' | 'uniqueKey'>;

/** Records an eventDoc AI in config so code that only has `qpqConfig` (e.g. an action processor) can find it and its doc context. */
export const defineEventDocAiRegistration = (options: EventDocAiRegistrationOptions): EventDocAiQPQConfigSetting => ({
  configSettingType: EVENT_DOC_AI_CONFIG_SETTING_TYPE,
  uniqueKey: options.aiName,

  ...options,
});

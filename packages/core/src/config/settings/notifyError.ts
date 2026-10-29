import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedNotifyErrorSettings = {
  onAlarm: {
    publishToEventBus?: string[];
  };
} & QPQConfigAdvancedSettings;

export type NotifyErrorQPQConfigSetting = {
  name: string;

  onAlarm: {
    publishToEventBus?: string[];
  };
} & QPQConfigSetting;

export const defineNotifyError = (name: string, options?: QPQConfigAdvancedNotifyErrorSettings): NotifyErrorQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.notifyError,
  uniqueKey: name,

  name,
  onAlarm: {
    publishToEventBus: options?.onAlarm?.publishToEventBus,
  },
});

import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedNotifyErrorSettings extends QPQConfigAdvancedSettings {
  onAlarm: {
    publishToEventBus?: string[];
  };
}

export interface NotifyErrorQPQConfigSetting extends QPQConfigSetting {
  name: string;

  onAlarm: {
    publishToEventBus?: string[];
  };
}

export const defineNotifyError = (name: string, options?: QPQConfigAdvancedNotifyErrorSettings): NotifyErrorQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.notifyError,
  uniqueKey: name,

  name,
  onAlarm: {
    publishToEventBus: options?.onAlarm?.publishToEventBus,
  },
});

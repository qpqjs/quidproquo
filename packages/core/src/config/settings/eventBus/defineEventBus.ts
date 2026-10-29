import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { EventBusQPQConfigSetting, QPQConfigAdvancedEventBusSettings } from './types';

export const defineEventBus = (name: string, options?: QPQConfigAdvancedEventBusSettings): EventBusQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.eventBus,
  uniqueKey: name,

  name,

  deprecated: !!options?.deprecated,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),

  isFifo: options?.isFifo ?? false,
});

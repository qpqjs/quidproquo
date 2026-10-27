import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface QPQConfigAdvancedEventBusSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'eventBusName'>;

  isFifo?: boolean;
}

export interface EventBusQPQConfigSetting extends QPQConfigSetting {
  name: string;

  deprecated?: boolean;

  owner?: CrossModuleOwner;

  isFifo: boolean;
}

export const defineEventBus = (name: string, options?: QPQConfigAdvancedEventBusSettings): EventBusQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.eventBus,
  uniqueKey: name,

  name,

  deprecated: !!options?.deprecated,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),

  isFifo: options?.isFifo || false,
});

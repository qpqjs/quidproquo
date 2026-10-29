import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export type QPQConfigAdvancedEventBusSettings = {
  owner?: CrossModuleOwner<'eventBusName'>;

  isFifo?: boolean;
} & QPQConfigAdvancedSettings;

export type EventBusQPQConfigSetting = {
  name: string;

  deprecated?: boolean;

  owner?: CrossModuleOwner;

  isFifo: boolean;
} & QPQConfigSetting;

export const defineEventBus = (name: string, options?: QPQConfigAdvancedEventBusSettings): EventBusQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.eventBus,
  uniqueKey: name,

  name,

  deprecated: !!options?.deprecated,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),

  isFifo: options?.isFifo ?? false,
});

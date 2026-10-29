import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { QPQConfigAdvancedStorageDriveSettings, StorageDriveQPQConfigSetting } from './types';

export const defineStorageDrive = (storageDrive: string, options?: QPQConfigAdvancedStorageDriveSettings): StorageDriveQPQConfigSetting => {
  // copyPath content is deployed straight to the bucket root, outside every
  // scope, so it can never coexist with a scoped drive.
  if (options?.scoped && options.copyPath) {
    throw new Error(`Storage drive '${storageDrive}' cannot be both scoped and have a copyPath`);
  }

  return {
    configSettingType: QPQCoreConfigSettingType.storageDrive,
    uniqueKey: storageDrive,

    storageDrive,

    copyPath: options?.copyPath,

    global: options?.global ?? false,

    onEvent: options?.onEvent,

    lifecycleRules: options?.lifecycleRules,

    cryptoKeyName: options?.cryptoKeyName,
    scoped: options?.scoped ?? false,
    lockedDown: options?.lockedDown ?? false,

    owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};

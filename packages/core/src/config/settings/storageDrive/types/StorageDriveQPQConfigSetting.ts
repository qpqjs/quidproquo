import { QPQConfigSetting } from '../../../QPQConfig';
import { StorageDriveEvents } from './StorageDriveEvents';
import { StorageDriveLifecycleRule } from './StorageDriveLifecycleRule';

export type StorageDriveQPQConfigSetting = {
  storageDrive: string;
  copyPath?: string;
  global: boolean;

  onEvent?: StorageDriveEvents;

  lifecycleRules?: StorageDriveLifecycleRule[];

  cryptoKeyName?: string;
  scoped: boolean;
  lockedDown: boolean;
} & QPQConfigSetting;

import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';
import { StorageDriveEvents } from './StorageDriveEvents';
import { StorageDriveLifecycleRule } from './StorageDriveLifecycleRule';

export type QPQConfigAdvancedStorageDriveSettings = {
  copyPath?: string;
  global?: boolean;

  onEvent?: StorageDriveEvents;

  lifecycleRules?: StorageDriveLifecycleRule[];

  // Encrypt the drive with the named defineCryptoKey instead of the provider's own managed
  // encryption, which always applies. The key must be declared in the same config, owned or
  // foreign; a foreign key's owning service must be deployed first.
  cryptoKeyName?: string;

  // Every file action on this drive must carry a scope; an unscoped call is refused
  // rather than written to the bare path. Incompatible with copyPath.
  scoped?: boolean;

  // Only the owning service's runtime role may read objects. Every other principal in the
  // account, humans included, is denied at the bucket; writes and listing are unaffected.
  lockedDown?: boolean;

  owner?: CrossModuleOwner<'storageDriveName'>;
} & QPQConfigAdvancedSettings;

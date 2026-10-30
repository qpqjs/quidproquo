import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';
import { CompositeKvsIndex } from './CompositeKvsIndex';
import { KvsStreamSettings } from './KvsStreamSettings';

export type QPQConfigAdvancedKeyValueStoreSettings<T extends object = any> = {
  indexes?: CompositeKvsIndex<T>[];

  global?: boolean;

  owner?: CrossModuleOwner;

  ttlAttribute?: string;

  // Point-in-time recovery (35-day continuous backups) is on by default; set this to opt out.
  disablePointInTimeRecovery?: boolean;

  // Encrypt the table with the named defineCryptoKey instead of the provider's own managed
  // encryption, which always applies. The key must be declared in the same config, owned or
  // foreign; a foreign key's owning service must be deployed first.
  cryptoKeyName?: string;

  // Every action on this store must carry a scope; an unscoped call is refused rather
  // than hitting the unpartitioned rows. askKeyValueStoreScanAllScopes is exempt.
  scoped?: boolean;

  // Turn on change data capture, see KvsStreamSettings. Absent means no stream is
  // created at all.
  onStream?: KvsStreamSettings;
} & QPQConfigAdvancedSettings;

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

  // Whether taking this store out of the config deletes it and every row in it, for good. Set it to
  // false on any store whose rows must outlive a mistake in the config: left unset, the deployment
  // decides, and a deployment that says nothing deletes. It only takes effect once deployed, so a
  // store deployed as kept must be deployed as deletable before the deploy that removes it. Renaming
  // a store counts as removing it.
  deleteOnRemove?: boolean;

  // Turn on change data capture, see KvsStreamSettings. Absent means no stream is
  // created at all.
  onStream?: KvsStreamSettings;
} & QPQConfigAdvancedSettings;

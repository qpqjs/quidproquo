import { CrossModuleOwner, QPQConfigAdvancedSettings } from '@qpqjs/core';

export type QPQConfigAdvancedCacheSettings = {
  owner?: CrossModuleOwner<'cacheName'>;
} & QPQConfigAdvancedSettings;

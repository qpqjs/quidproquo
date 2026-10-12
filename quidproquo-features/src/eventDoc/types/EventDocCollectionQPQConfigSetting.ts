import { QPQConfigSetting } from 'quidproquo-core';

import { EventDocStore } from './EventDocStore';

/** A mounted collection's store (with its hooks) and the user directory its routes authenticate against. */
export type EventDocCollectionQPQConfigSetting = QPQConfigSetting & {
  store: EventDocStore;
  userDirectoryName?: string;
};

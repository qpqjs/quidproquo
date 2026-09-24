import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineKeyValueStoreStreamSmoke } from './config/defineKeyValueStoreStreamSmoke';
import { askRunKeyValueStoreStreamTest } from './logic/askRunKeyValueStoreStreamTest';

/** A scoped store's change stream, as its handler sees it. */
export const keyValueStoreStreamSmokeSuite: SmokeSuite = {
  defineConfig: defineKeyValueStoreStreamSmoke,
  tests: [
    { name: 'keyValueStoreStream', askRun: askRunKeyValueStoreStreamTest },
  ],
};

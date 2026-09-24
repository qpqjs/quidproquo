import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineScopedKeyValueStoreSmoke } from './config/defineScopedKeyValueStoreSmoke';
import { askRunScopedKeyValueStoreTest } from './logic/askRunScopedKeyValueStoreTest';

/** A scoped store's gate and partition isolation. */
export const scopedKeyValueStoreSmokeSuite: SmokeSuite = {
  defineConfig: defineScopedKeyValueStoreSmoke,
  tests: [
    { name: 'scopedKeyValueStore', askRun: askRunScopedKeyValueStoreTest },
  ],
};

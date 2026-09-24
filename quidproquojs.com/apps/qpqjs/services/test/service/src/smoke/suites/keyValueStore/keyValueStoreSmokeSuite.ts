import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunCrossServiceKeyValueStoreTest } from './logic/askRunCrossServiceKeyValueStoreTest';
import { askRunKeyValueStoreTest } from './logic/askRunKeyValueStoreTest';

/** Every DynamoDB action on the probe store, from this service and from testa. No config: the store belongs to the harness. */
export const keyValueStoreSmokeSuite: SmokeSuite = {
  tests: [
    { name: 'keyValueStore', askRun: askRunKeyValueStoreTest },
    {
      name: 'crossServiceKeyValueStore',
      askRun: askRunCrossServiceKeyValueStoreTest,
    },
  ],
};

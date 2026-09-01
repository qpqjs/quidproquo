import { askRunCrossServiceKeyValueStoreTest } from './crossService/askRunCrossServiceKeyValueStoreTest';
import { askRunCrossServiceStorageDriveTest } from './crossService/askRunCrossServiceStorageDriveTest';
import { askRunEventBusTest } from './eventBus/askRunEventBusTest';
import { askRunKeyValueStoreTest } from './keyValueStore/askRunKeyValueStoreTest';
import { askRunNoopTest } from './noop/askRunNoopTest';
import { askRunParameterTest } from './parameter/askRunParameterTest';
import { askRunSecretTest } from './secret/askRunSecretTest';
import { askRunStorageDriveTest } from './storageDrive/askRunStorageDriveTest';
import { SmokeTestDefinition } from './SmokeTestDefinition';

// Every smoke test a run executes, in order. A test's id in the run record is
// its 1-based position here, so append rather than reorder where possible.
// Adding a test: one folder with its askRun<Name>Test story, one line here.
export const smokeTestRegistry: SmokeTestDefinition[] = [
  { name: 'noop', askRun: askRunNoopTest },
  { name: 'keyValueStore', askRun: askRunKeyValueStoreTest },
  { name: 'parameter', askRun: askRunParameterTest },
  { name: 'secret', askRun: askRunSecretTest },
  { name: 'storageDrive', askRun: askRunStorageDriveTest },
  { name: 'eventBus', askRun: askRunEventBusTest },
  {
    name: 'crossServiceKeyValueStore',
    askRun: askRunCrossServiceKeyValueStoreTest,
  },
  {
    name: 'crossServiceStorageDrive',
    askRun: askRunCrossServiceStorageDriveTest,
  },
];

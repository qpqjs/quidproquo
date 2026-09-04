import { askRunCrossServiceKeyValueStoreTest } from './crossService/askRunCrossServiceKeyValueStoreTest';
import { askRunCrossServiceStorageDriveTest } from './crossService/askRunCrossServiceStorageDriveTest';
import { askRunEventBusTest } from './eventBus/askRunEventBusTest';
import { askRunKeyValueStoreTest } from './keyValueStore/askRunKeyValueStoreTest';
import { askRunNoopTest } from './noop/askRunNoopTest';
import { askRunEchoRoundTripTest } from './openApi/askRunEchoRoundTripTest';
import { askRunOpenApiDocumentTest } from './openApi/askRunOpenApiDocumentTest';
import { askRunParameterTest } from './parameter/askRunParameterTest';
import { askRunScheduleTest } from './schedule/askRunScheduleTest';
import { askRunSecretTest } from './secret/askRunSecretTest';
import { askRunStorageDriveTest } from './storageDrive/askRunStorageDriveTest';
import { SmokeTestDefinition } from './SmokeTestDefinition';

// Every smoke test a run executes. They run in parallel, one queue message
// each, so nothing here may depend on another test having finished. A test's
// id in the run record is its 1-based position here, so append rather than
// reorder where possible; `name` is the key the queue message carries.
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
  { name: 'schedule', askRun: askRunScheduleTest },
  { name: 'openApiDocument', askRun: askRunOpenApiDocumentTest },
  { name: 'echoRoundTrip', askRun: askRunEchoRoundTripTest },
];

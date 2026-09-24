import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineStorageDriveSmoke } from './config/defineStorageDriveSmoke';
import { askRunCrossServiceStorageDriveTest } from './logic/askRunCrossServiceStorageDriveTest';
import { askRunStorageDriveTest } from './logic/askRunStorageDriveTest';

/** An owned drive, from this service and from testa. */
export const storageDriveSmokeSuite: SmokeSuite = {
  defineConfig: defineStorageDriveSmoke,
  tests: [
    { name: 'storageDrive', askRun: askRunStorageDriveTest },
    {
      name: 'crossServiceStorageDrive',
      askRun: askRunCrossServiceStorageDriveTest,
    },
  ],
};

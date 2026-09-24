import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineStorageDriveEventSmoke } from './config/defineStorageDriveEventSmoke';
import { askRunScopedStorageDriveTest } from './logic/askRunScopedStorageDriveTest';
import { askRunStorageDriveEventTest } from './logic/askRunStorageDriveEventTest';

/** The scoped drive's gate, and file events off it and an unscoped drive. */
export const storageDriveEventSmokeSuite: SmokeSuite = {
  defineConfig: defineStorageDriveEventSmoke,
  tests: [
    { name: 'scopedStorageDrive', askRun: askRunScopedStorageDriveTest },
    { name: 'storageDriveEvent', askRun: askRunStorageDriveEventTest },
  ],
};

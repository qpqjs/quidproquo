import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineStorageDriveEventSmoke } from './config/defineStorageDriveEventSmoke';
import { askRunStorageDriveEventTest } from './logic/askRunStorageDriveEventTest';

/** File create and delete events off an unscoped and a scoped drive. */
export const storageDriveEventSmokeSuite: SmokeSuite = {
  defineConfig: defineStorageDriveEventSmoke,
  tests: [{ name: 'storageDriveEvent', askRun: askRunStorageDriveEventTest }],
};

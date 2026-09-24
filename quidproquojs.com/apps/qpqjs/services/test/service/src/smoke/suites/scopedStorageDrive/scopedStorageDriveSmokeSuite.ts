import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineScopedStorageDriveSmoke } from './config/defineScopedStorageDriveSmoke';
import { askRunScopedStorageDriveTest } from './logic/askRunScopedStorageDriveTest';

/** A scoped drive's gate and partition isolation. */
export const scopedStorageDriveSmokeSuite: SmokeSuite = {
  defineConfig: defineScopedStorageDriveSmoke,
  tests: [{ name: 'scopedStorageDrive', askRun: askRunScopedStorageDriveTest }],
};

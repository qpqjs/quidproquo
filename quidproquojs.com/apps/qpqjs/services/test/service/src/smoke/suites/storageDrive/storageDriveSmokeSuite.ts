import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunCrossServiceStorageDriveTest } from './logic/askRunCrossServiceStorageDriveTest';
import { askRunStorageDriveTest } from './logic/askRunStorageDriveTest';

/** Every S3 action on the probe drive, from this service and from testa. No config: the drive belongs to the harness. */
export const storageDriveSmokeSuite: SmokeSuite = {
  tests: [
    { name: 'storageDrive', askRun: askRunStorageDriveTest },
    {
      name: 'crossServiceStorageDrive',
      askRun: askRunCrossServiceStorageDriveTest,
    },
  ],
};

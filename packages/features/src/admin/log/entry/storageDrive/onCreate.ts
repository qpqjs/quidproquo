import { StorageDriveEvent } from '@qpqjs/webserver';

import { askUpdateDatabaseFromLogFiles } from '../../logic/askUpdateDatabaseFromLogFiles';

export function* onCreate(event: StorageDriveEvent) {
  yield* askUpdateDatabaseFromLogFiles(event.driveName, event.filePaths);
}

import { StorageDriveEvent } from '@qpqjs/webserver';

import { askLogUpdateDatabaseFromFiles } from '../../logic/updateDatabase';

export function* onCreate(event: StorageDriveEvent) {
  yield* askLogUpdateDatabaseFromFiles(event.driveName, event.filePaths);
}

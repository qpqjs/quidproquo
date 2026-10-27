import { splitScopedFilePath, StorageDriveQPQConfigSetting } from '@qpqjs/core';
import { StorageDriveEvent, StorageDriveEventType } from '@qpqjs/webserver';

import * as path from 'path';

import { FileEventPayload } from './FileEventPayload';

/**
 * The drive event a watched file becomes. On a scoped drive the first folder under the drive is the
 * scope, matching the S3 key layout; a file outside any scope folder throws, as it does deployed.
 */
export const toStorageDriveEvent = (eventPayload: FileEventPayload, storageDrive: StorageDriveQPQConfigSetting): StorageDriveEvent => {
  const eventType = eventPayload.event === 'create' ? StorageDriveEventType.Create : StorageDriveEventType.Delete;
  const storedPath = eventPayload.filepath.split(path.sep).join('/');

  if (!storageDrive.scoped) {
    return { eventType, driveName: eventPayload.drive, filePaths: [storedPath] };
  }

  const { scope, filepath } = splitScopedFilePath(storedPath);

  return { eventType, driveName: eventPayload.drive, scope, filePaths: [filepath] };
};

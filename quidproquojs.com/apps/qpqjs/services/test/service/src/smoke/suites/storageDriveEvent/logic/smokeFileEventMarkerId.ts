import { StorageDriveEventType } from 'quidproquo';

// The marker row id for one file event: the file's own id (its basename
// without extension) plus the event type, so a create and its delete are two
// rows the test can poll for separately.
export const smokeFileEventMarkerId = (
  filepath: string,
  eventType: StorageDriveEventType
): string => {
  const basename = filepath.split('/').pop() ?? filepath;
  const fileId = basename.replace(/\.[^.]*$/, '');

  return `${fileId}-${eventType.toLowerCase()}`;
};

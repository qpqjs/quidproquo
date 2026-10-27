// Thrown when a file action names a storage drive that has no defineStorageDrive
// in the qpq config. A named subclass so processor catch-maps can key on the
// error name and return the action's typed DriveNotFound error.
export class StorageDriveNotFoundError extends Error {
  constructor(drive: string) {
    super(`Storage drive '${drive}' not found in configuration`);
    this.name = 'StorageDriveNotFoundError';
  }
}

export enum StorageDriveEventType {
  Create = 'Create',
  Delete = 'Delete',
}

export type StorageDriveEvent = {
  eventType: StorageDriveEventType;
  driveName: string;

  // Set when the drive is scoped: the scope the object lives under, with
  // filePaths made scope-relative. The handler runs with it as the ambient
  // storage scope, so file and kvs calls inside it inherit the partition.
  scope?: string;

  filePaths: string[];
};

export type StorageDriveEventResponse = void;

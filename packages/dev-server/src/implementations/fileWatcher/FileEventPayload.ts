/** A file the watcher saw under `<storage root>/<service>/<drive>/`, with the path relative to the drive. */
export type FileEventPayload = {
  service: string;
  drive: string;
  filepath: string;
  event: 'create' | 'delete';
};

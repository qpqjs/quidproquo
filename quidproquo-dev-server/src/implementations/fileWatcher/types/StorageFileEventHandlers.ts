/**
 * Callbacks for regular files appearing under or vanishing from a watched
 * storage directory. Both receive the file's absolute path and are not awaited.
 */
export type StorageFileEventHandlers = {
  onFileCreated: (filePath: string) => void;
  onFileDeleted: (filePath: string) => void;
};

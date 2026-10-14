/** A live storage directory watch. close releases the OS watch and drops any checks still pending. */
export type StorageDirectoryWatcher = {
  close: () => Promise<void>;
};

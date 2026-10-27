export enum UserScriptArchiveErrorCode {
  // Not a zip this runtime can read, or an entry is encrypted or corrupt.
  InvalidArchive = 'InvalidArchive',
  // An entry path would escape the project, or an entry is a symlink.
  UnsafeArchiveEntry = 'UnsafeArchiveEntry',
  // Too many files, too many unpacked bytes, or a node_modules folder.
  SourceTooLarge = 'SourceTooLarge',
}

/** Thrown by extractUserScriptZip; `code` names which rule the archive broke. */
export class UserScriptArchiveError extends Error {
  constructor(
    public readonly code: UserScriptArchiveErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UserScriptArchiveError';
  }
}

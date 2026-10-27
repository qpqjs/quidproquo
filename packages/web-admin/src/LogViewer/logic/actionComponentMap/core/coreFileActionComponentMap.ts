import { FileActionType } from 'quidproquo-core';

const coreFileActionComponentMap: Record<string, string[]> = {
  [FileActionType.ReadTextContents]: ['askFileReadTextContents', 'drive', 'filepath'],
  [FileActionType.WriteTextContents]: ['askFileWriteTextContents', 'drive', 'filepath', 'data', 'storageDriveAdvancedWriteOptions'],
  [FileActionType.ListDirectory]: ['askFileListDirectory', 'drive', 'folderPath', 'maxFiles', 'pageToken'],
  [FileActionType.Exists]: ['askFileExists', 'drive', 'filepath'],
  [FileActionType.Delete]: ['askFileDelete', 'drive', 'filepaths'],
  [FileActionType.Copy]: ['askFileCopy', 'sourceDrive', 'sourceFilepath', 'targetDrive', 'targetFilepath'],
  [FileActionType.ReadBinaryContents]: ['askFileReadBinaryContents', 'drive', 'filepath'],
  [FileActionType.WriteBinaryContents]: ['askFileWriteBinaryContents', 'drive', 'filepath', 'data', 'storageDriveAdvancedWriteOptions'],
  [FileActionType.GenerateTemporarySecureUrl]: ['askFileGenerateTemporarySecureUrl', 'drive', 'filepath', 'expirationMs'],
  [FileActionType.GenerateTemporaryUploadSecureUrl]: ['askFileGenerateTemporaryUploadSecureUrl', 'drive', 'filepath', 'expirationMs', 'contentType'],
  [FileActionType.ReadObjectJson]: ['askFileReadObjectJson', 'drive', 'filepath'],
  [FileActionType.WriteObjectJson]: ['askFileWriteObjectJson', 'drive', 'filepath', 'data', 'storageDriveAdvancedWriteOptions'],
  [FileActionType.IsColdStorage]: ['askFileIsColdStorage', 'drive', 'filepath'],
  [FileActionType.StreamOpen]: ['askFileStreamOpen', 'drive', 'filepath', 'encoding', 'chunkSize'],
};

export default coreFileActionComponentMap;

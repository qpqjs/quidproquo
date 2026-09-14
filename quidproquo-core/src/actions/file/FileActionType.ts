import { StorageDriveTier } from '../../config';

export enum FileActionType {
  ReadTextContents = '@quidproquo-core/File/ReadTextContents',
  WriteTextContents = '@quidproquo-core/File/WriteTextContents',
  WriteObjectJson = '@quidproquo-core/File/WriteObjectJson',
  ReadObjectJson = '@quidproquo-core/File/ReadObjectJson',
  ListDirectory = '@quidproquo-core/File/ListDirectory',
  Exists = '@quidproquo-core/File/Exists',
  Delete = '@quidproquo-core/File/Delete',
  Copy = '@quidproquo-core/File/Copy',
  ReadBinaryContents = '@quidproquo-core/File/ReadBinaryContents',
  WriteBinaryContents = '@quidproquo-core/File/WriteBinaryContents',
  GenerateTemporarySecureUrl = '@quidproquo-core/File/GenerateTemporarySecureUrl',
  GenerateTemporaryUploadSecureUrl = '@quidproquo-core/File/GenerateTemporaryUploadSecureUrl',
  IsColdStorage = '@quidproquo-core/File/IsColdStorage',
  StreamOpen = '@quidproquo-core/File/StreamOpen',
}

export const filePathDelimiter = `/`;

export interface FileInfo {
  filepath: string;
  drive: string;
  isDir: boolean;
  hashMd5?: string;
}

export interface DirectoryList {
  fileInfos: FileInfo[];
  pageToken?: string;
}

export interface StorageDriveAdvancedWriteOptions {
  storageDriveTier?: StorageDriveTier;
}

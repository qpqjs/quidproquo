import { FileInfo } from './FileInfo';

export type DirectoryList = {
  fileInfos: FileInfo[];
  pageToken?: string;
};

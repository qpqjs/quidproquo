import { AskResponse } from '../../types/StorySession';
import { askFileListDirectory } from './askFileListDirectory';
import { FileInfo } from './types';

/** Lists every file under a folder, following page tokens until the directory is exhausted. */
export function* askFileListAllDirectory(drive: string, folderPath: string, scope?: string): AskResponse<FileInfo[]> {
  let pageToken: string | undefined;
  let fileInfos: FileInfo[] = [];

  while (true) {
    const directoryInfo = yield* askFileListDirectory(drive, folderPath, 1000, pageToken, scope);

    fileInfos = [...fileInfos, ...directoryInfo.fileInfos];

    if (!directoryInfo.pageToken) {
      break;
    }

    pageToken = directoryInfo.pageToken;
  }

  return fileInfos;
}

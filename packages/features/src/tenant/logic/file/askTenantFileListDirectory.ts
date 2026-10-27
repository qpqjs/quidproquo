import { askFileListDirectory, AskResponse, DirectoryList, FileInfo } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileListDirectory(
  drive: string,
  folderPath: string,
  maxFiles: number = 1000,
  pageToken?: string,
): AskResponse<DirectoryList> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileListDirectory(drive, folderPath, maxFiles, pageToken, tenantId);
}

export function* askTenantFileListAllDirectory(drive: string, folderPath: string): AskResponse<FileInfo[]> {
  let pageToken: string | undefined;
  let fileInfos: FileInfo[] = [];

  while (true) {
    const directoryInfo = yield* askTenantFileListDirectory(drive, folderPath, 1000, pageToken);

    fileInfos = [...fileInfos, ...directoryInfo.fileInfos];

    if (!directoryInfo.pageToken) {
      break;
    }

    pageToken = directoryInfo.pageToken;
  }

  return fileInfos;
}

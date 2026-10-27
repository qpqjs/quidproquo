import { askCatch, askFileListAllDirectory, askFileListDirectory, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocAssetFolderPath } from './eventDocAssetPath';

const assetGuidFromFilepath = (filepath: string): string => filepath.split('/').slice(-1)[0];

/**
 * Every asset guid under a doc's `<docId>/assets/` prefix. Guids only: filename and mimetype live in the event that
 * recorded the EventDocAssetRef.
 */
export function* askEventDocListAssets(docId: string): AskResponse<string[]> {
  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const listed = yield* askCatch(askFileListAllDirectory(storageDriveName, eventDocAssetFolderPath(docId), scope));

  if (!listed.success) {
    // S3 lists a missing prefix as empty but a filesystem drive raises DirectoryNotFound; both mean "no assets yet".
    if (listed.error.errorType === askFileListDirectory.errorType.DirectoryNotFound) {
      return [];
    }

    return yield* askThrowError(listed.error.errorType as ErrorTypeEnum, listed.error.errorText, listed.error.errorStack);
  }

  return listed.result.filter((fileInfo) => !fileInfo.isDir).map((fileInfo) => assetGuidFromFilepath(fileInfo.filepath));
}

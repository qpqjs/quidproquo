import { askFileCopy, askNewGuid, AskResponse } from 'quidproquo-core';

import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocAssetRef } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocAssetPath } from './eventDocAssetPath';

/**
 * Copies an asset from a document in `sourceStoreName`'s collection onto `targetDocId` in THIS collection (the
 * provided store context) as a new immutable asset, and returns its ref. The bytes never cross the story (a
 * server-side copy); the stored mimetype/content disposition come with them. `targetFilename` is the copy's ref
 * filename (the target document's own name for the file); the default keeps the source's. Both sides resolve under the
 * ambient scope, so a copy never crosses a tenant partition.
 */
export function* askEventDocCopyAsset(
  sourceStoreName: string,
  sourceDocId: string,
  sourceAsset: EventDocAssetRef,
  targetDocId: string,
  targetFilename?: string,
): AskResponse<EventDocAssetRef> {
  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();
  const guid = yield* askNewGuid();

  yield* askFileCopy(
    eventDocStorageDriveName(sourceStoreName),
    eventDocAssetPath(sourceDocId, sourceAsset.guid),
    storageDriveName,
    eventDocAssetPath(targetDocId, guid),
    scope,
  );

  return {
    guid,
    filename: targetFilename ?? sourceAsset.filename,
    mimetype: sourceAsset.mimetype,
  };
}

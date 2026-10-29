import { askFileWriteBinaryContents, askGuidNew, AskResponse, QPQBinaryData } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocAssetRef } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

const FALLBACK_MIMETYPE = 'application/octet-stream';

/**
 * Writes a server-held binary as an immutable asset at `<docId>/assets/<guid>` and returns its ref. Server-side twin of
 * the presigned upload flow. Assumes the store context is provided.
 */
export function* askEventDocWriteAsset(docId: string, binary: QPQBinaryData): AskResponse<EventDocAssetRef> {
  const { storageDriveName } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();
  const guid = yield* askGuidNew();

  yield* askFileWriteBinaryContents(storageDriveName, `${docId}/assets/${guid}`, binary, undefined, scope);

  return {
    guid,
    filename: binary.filename,
    mimetype: binary.mimetype ?? FALLBACK_MIMETYPE,
  };
}

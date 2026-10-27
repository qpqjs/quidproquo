import { askFileWriteBinaryContents, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../../eventDoc/context';
import { askEventDocListAssets, askEventDocResolveScope, eventDocAssetPath } from '../../eventDoc/data';
import { EventDocBundleAsset } from '../models';

/**
 * Writes a bundle's asset blobs into the collection's drive at their original ids so the doc's asset refs keep resolving.
 * Assets are immutable, so an id already present is skipped. Requires the store context.
 */
export function* askEventDocTransferWriteAssets(docId: string, assets: EventDocBundleAsset[]): AskResponse<number> {
  if (assets.length === 0) {
    return 0;
  }

  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const existing = yield* askEventDocListAssets(docId);
  const missing = assets.filter((asset) => !existing.includes(asset.guid));

  for (const asset of missing) {
    yield* askFileWriteBinaryContents(storageDriveName, eventDocAssetPath(docId, asset.guid), asset.data, undefined, scope);
  }

  return missing.length;
}

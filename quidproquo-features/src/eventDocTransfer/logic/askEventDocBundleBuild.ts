import { askConfigGetApplicationInfo, askDateNow, askFileReadBinaryContents, AskResponse, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocResolveStore } from '../../eventDoc/context';
import { askEventDocEventListAll, askEventDocListAssets, askEventDocResolveScope, eventDocAssetPath } from '../../eventDoc/data';
import { EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION } from '../constants';
import { EventDocBundle, EventDocBundleAsset, EventDocBundleDoc, EventDocDocRef, EventDocTransferRegistry } from '../models';
import { askEventDocTransferProvideCollection } from './askEventDocTransferProvideCollection';

// Assets travel by value: the target environment cannot reach this drive.
function* askEventDocBundleReadDoc(ref: EventDocDocRef): AskResponse<EventDocBundleDoc> {
  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const events = yield* askEventDocEventListAll(ref.id);
  const assetIds = yield* askEventDocListAssets(ref.id);

  const assets: EventDocBundleAsset[] = [];

  for (const guid of assetIds) {
    const data = yield* askFileReadBinaryContents(storageDriveName, eventDocAssetPath(ref.id, guid), scope);
    assets.push({ guid, data });
  }

  return { ...ref, events, assets };
}

/** Builds a bundle for an exact set of docs. Events travel verbatim; no summary travels, the target folds its own. */
export function* askEventDocBundleBuild(registry: EventDocTransferRegistry, refs: EventDocDocRef[]): AskResponse<EventDocBundle> {
  const applicationInfo = yield* askConfigGetApplicationInfo();
  const exportedAt = (yield* askDateNow()) as QpqIsoDateTime;

  const docs: EventDocBundleDoc[] = [];

  for (const ref of refs) {
    docs.push(yield* askEventDocTransferProvideCollection(registry, ref, askEventDocBundleReadDoc(ref)));
  }

  return {
    formatVersion: EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION,
    source: {
      application: applicationInfo.name,
      environment: applicationInfo.environment,
      exportedAt,
    },
    docs,
  };
}

import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION } from '../constants';
import { EventDocBundle, EventDocBundleApplyOptions, EventDocTransferPlanRow, EventDocTransferRegistry } from '../models';
import { askEventDocBundleApplyDoc } from './askEventDocBundleApplyDoc';
import { askEventDocTransferProvideCollection } from './askEventDocTransferProvideCollection';

/**
 * Imports every doc in the bundle in bundle order (leaves first) and reports a plan row per doc.
 * Docs are independent: a blocked doc is reported and the rest still land; re-running after fixing it is safe.
 */
export function* askEventDocBundleApply(
  registry: EventDocTransferRegistry,
  bundle: EventDocBundle,
  options: EventDocBundleApplyOptions,
): AskResponse<EventDocTransferPlanRow[]> {
  if (bundle.formatVersion !== EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION) {
    return yield* askThrowError(
      ErrorTypeEnum.BadRequest,
      `Bundle format version ${bundle.formatVersion} is not supported (this deployment reads version ${EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION}).`,
    );
  }

  const rows: EventDocTransferPlanRow[] = [];

  for (const doc of bundle.docs) {
    rows.push(yield* askEventDocTransferProvideCollection(registry, doc, askEventDocBundleApplyDoc(doc, options)));
  }

  return rows;
}

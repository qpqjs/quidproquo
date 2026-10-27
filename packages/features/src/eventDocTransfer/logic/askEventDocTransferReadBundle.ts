import { askFileReadObjectJson, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc/data';
import { EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION, EVENT_DOC_TRANSFER_DRIVE_NAME, eventDocTransferImportPath } from '../constants';
import { EventDocBundle } from '../models';

/** Reads an uploaded bundle off the transfer drive, refusing an unsupported format version. */
export function* askEventDocTransferReadBundle(transferId: string): AskResponse<EventDocBundle> {
  const scope = yield* askEventDocResolveScope();

  const bundle = yield* askFileReadObjectJson<EventDocBundle>(EVENT_DOC_TRANSFER_DRIVE_NAME, eventDocTransferImportPath(transferId), scope);

  if (bundle.formatVersion !== EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION) {
    return yield* askThrowError(
      ErrorTypeEnum.BadRequest,
      `Bundle format version ${bundle.formatVersion} is not supported (this deployment reads version ${EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION}).`,
    );
  }

  return bundle;
}

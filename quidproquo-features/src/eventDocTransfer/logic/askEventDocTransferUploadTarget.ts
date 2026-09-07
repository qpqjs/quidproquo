import { askFileGenerateTemporaryUploadSecureUrl, askNewGuid, AskResponse } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc/data';
import { EVENT_DOC_TRANSFER_DRIVE_NAME, eventDocTransferImportPath } from '../constants';
import { EventDocTransferUploadTarget } from '../models';

const BUNDLE_UPLOAD_TTL_MS = 10 * 60 * 1000;

/** Mints a presigned PUT for an incoming bundle plus the transferId to quote back to plan/import. */
export function* askEventDocTransferUploadTarget(): AskResponse<EventDocTransferUploadTarget> {
  const scope = yield* askEventDocResolveScope();
  const transferId = yield* askNewGuid();

  const uploadUrl = yield* askFileGenerateTemporaryUploadSecureUrl(
    EVENT_DOC_TRANSFER_DRIVE_NAME,
    eventDocTransferImportPath(transferId),
    BUNDLE_UPLOAD_TTL_MS,
    { contentType: 'application/json' },
    scope,
  );

  return { uploadUrl, transferId };
}

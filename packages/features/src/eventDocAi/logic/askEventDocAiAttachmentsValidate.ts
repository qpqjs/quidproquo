import { askFileExists, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocResolveScope, eventDocAssetPath } from '../../eventDoc';
import type { EventDocAiAttachment } from '../models';

// assetIds are guid-shaped; anything else (slashes, dots) could path-traverse the drive.
const VALID_ASSET_ID = /^[A-Za-z0-9-]+$/;

// Attachments arrive from the client as bare assetIds — only ids that resolve to a
// real asset under the session's trusted docId may reach the model (no path
// traversal, no cross-doc or cross-drive reads).
export function* askEventDocAiAttachmentsValidate(docStorageDrive: string, docId: string, attachments: EventDocAiAttachment[]): AskResponse<void> {
  const scope = yield* askEventDocResolveScope();

  for (const attachment of attachments) {
    if (!VALID_ASSET_ID.test(attachment.assetId)) {
      return yield* askThrowError(ErrorTypeEnum.Invalid, `invalid attachment assetId: ${attachment.assetId}`);
    }

    const exists = yield* askFileExists(docStorageDrive, eventDocAssetPath(docId, attachment.assetId), scope);

    if (!exists) {
      return yield* askThrowError(ErrorTypeEnum.NotFound, `attachment asset not found: ${attachment.assetId}`);
    }
  }
}

import { askConfigGetGlobal, askFileGenerateTemporarySecureUrl, AskResponse } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_ROW_CONTENT_URL_EXPIRY_MS } from '../constants/eventDocAiChatRowContentUrlExpiryMs';
import { EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import { eventDocAiChatRowContentPath } from './eventDocAiChatRowContentPath';

/** A short-lived link to one chat row's stored content. The caller has checked the row exists and holds its content in storage. */
export function* askEventDocAiChatRowContentUrl(docId: string, chatId: string, sk: string): AskResponse<string> {
  const drive = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  return yield* askFileGenerateTemporarySecureUrl(
    drive,
    eventDocAiChatRowContentPath(docId, chatId, sk),
    EVENT_DOC_AI_CHAT_ROW_CONTENT_URL_EXPIRY_MS,
    scope,
  );
}

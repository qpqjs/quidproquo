import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetChatRowsEffect } from '../effects/EventDocAiSetChatRowsEffect';

/** Replaces a chat's rows with a fresh full load from the server. */
export function* askEventDocAiSetChatRows(chatId: string, rows: EventDocAiChatRow[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetChatRowsEffect>(EventDocAiEffect.SetChatRows, { chatId, rows });
}

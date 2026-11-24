import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiPrependChatRowsEffect } from '../effects/EventDocAiPrependChatRowsEffect';

/** Adds an older page of a chat's rows above the ones already loaded. */
export function* askEventDocAiPrependChatRows(chatId: string, rows: EventDocAiChatRow[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiPrependChatRowsEffect>(EventDocAiEffect.PrependChatRows, { chatId, rows });
}

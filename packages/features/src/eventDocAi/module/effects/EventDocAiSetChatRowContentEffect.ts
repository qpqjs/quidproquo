import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetChatRowContentPayload = {
  chatId: string;
  sk: string;
  content: unknown;
};

/** Puts content that was held in storage onto its row, once it has been downloaded. Ignored when that chat is no longer open. */
export type EventDocAiSetChatRowContentEffect = Effect<EventDocAiEffect.SetChatRowContent, SetChatRowContentPayload>;

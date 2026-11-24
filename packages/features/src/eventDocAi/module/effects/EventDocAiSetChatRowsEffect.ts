import type { Effect } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type SetChatRowsPayload = {
  chatId: string;
  rows: EventDocAiChatRow[];
};

/** Replaces the rows of a chat with a fresh full load from the server. Ignored when that chat is no longer open. */
export type EventDocAiSetChatRowsEffect = Effect<EventDocAiEffect.SetChatRows, SetChatRowsPayload>;

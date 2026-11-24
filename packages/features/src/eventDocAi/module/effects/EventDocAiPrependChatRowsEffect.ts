import type { Effect } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type PrependChatRowsPayload = {
  chatId: string;
  rows: EventDocAiChatRow[];
};

/** Adds an older page of a chat's rows above the ones already loaded. Ignored when that chat is no longer open. */
export type EventDocAiPrependChatRowsEffect = Effect<EventDocAiEffect.PrependChatRows, PrependChatRowsPayload>;

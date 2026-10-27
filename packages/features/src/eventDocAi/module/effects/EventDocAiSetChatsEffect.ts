import type { Effect } from '@qpqjs/core';

import type { EventDocAiChatSummary } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type SetChatsPayload = {
  chats: EventDocAiChatSummary[];
};

export type EventDocAiSetChatsEffect = Effect<EventDocAiEffect.SetChats, SetChatsPayload>;

import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ChatMessageSentData = {
  correlationId: string;
  message: string;
};

export type ChatMessageSentEvent = Effect<AdminSessionEventType.chatMessageSent, EventDocEventPayload<ChatMessageSentData>>;

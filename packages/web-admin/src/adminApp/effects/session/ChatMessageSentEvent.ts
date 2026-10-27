import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ChatMessageSentData = {
  correlationId: string;
  message: string;
};

export type ChatMessageSentEvent = Effect<AdminSessionEventType.chatMessageSent, EventDocEventPayload<ChatMessageSentData>>;

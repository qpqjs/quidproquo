import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionChatMessageSentData = {
  correlationId: string;
  message: string;
};

export type AdminSessionChatMessageSentEffect = Effect<AdminSessionEffect.ChatMessageSent, EventDocEventPayload<AdminSessionChatMessageSentData>>;

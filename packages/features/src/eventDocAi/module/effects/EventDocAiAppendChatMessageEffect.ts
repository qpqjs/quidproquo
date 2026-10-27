import type { Effect } from '@qpqjs/core';

import type { EventDocAiChatMessage } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type AppendChatMessagePayload = {
  message: EventDocAiChatMessage;
};

export type EventDocAiAppendChatMessageEffect = Effect<EventDocAiEffect.AppendChatMessage, AppendChatMessagePayload>;

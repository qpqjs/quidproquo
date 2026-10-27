import type { Effect } from '@qpqjs/core';

import type { EventDocAiChatMessage } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type SetMessagesPayload = {
  messages: EventDocAiChatMessage[];
};

export type EventDocAiSetMessagesEffect = Effect<EventDocAiEffect.SetMessages, SetMessagesPayload>;
